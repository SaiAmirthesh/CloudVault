package com.CloudVault.Backend.auth.security;

import com.CloudVault.Backend.auth.security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Value("${app.cors.allowed-origins}")
    private String allowedOriginsRaw;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // CSRF: Use CookieCsrfTokenRepository (double-submit cookie pattern).
        // XSRF-TOKEN cookie is readable by JS (not HttpOnly) so the frontend reads it
        // and sends it back as X-XSRF-TOKEN header on mutating requests.
        // The JWT access-token cookie IS HttpOnly — JavaScript cannot read it.
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();

        http
            // ── CORS (locked to configured origins) ────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ── CSRF (Cookie double-submit — safe with SameSite=Strict JWT cookie) ─
            // We use the authorizeHttpRequests rules to restrict who can hit mutating
            // endpoints. Auth endpoints (login/register) are public POST endpoints that
            // don't need CSRF protection because they don't rely on session cookies.
            // The client only gets a session (cookie) AFTER login succeeds.
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(csrfHandler)
                // Login/register are pre-auth — no session cookie yet, so CSRF doesn't apply
                .ignoringRequestMatchers("/auth/login", "/auth/register")
                // Share download is a public GET — CSRF not applicable to GET requests
                .ignoringRequestMatchers("/share/**")
                // Resumable upload endpoints handle JWT authentication directly
                .ignoringRequestMatchers("/uploads/**")
                // Swagger is dev-only
                .ignoringRequestMatchers("/swagger-ui/**", "/v3/api-docs/**")
            )

            // ── Session: stateless (JWT cookie-based) ──────────────────────────────
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Security Headers ────────────────────────────────────────────────────
            .headers(headers -> headers
                // Prevent clickjacking — deny all framing
                .frameOptions(frame -> frame.deny())
                // Prevent MIME type sniffing attacks
                .contentTypeOptions(contentType -> {})
                // HTTP Strict Transport Security (1 year, include subdomains)
                .httpStrictTransportSecurity(hsts -> hsts
                        .includeSubDomains(true)
                        .maxAgeInSeconds(31536000)
                )
                // Content Security Policy — restrict resource loading to same origin
                .contentSecurityPolicy(csp -> csp
                        .policyDirectives(
                                "default-src 'self'; " +
                                "script-src 'self'; " +
                                "style-src 'self' 'unsafe-inline'; " +
                                "img-src 'self' data: blob:; " +
                                "font-src 'self'; " +
                                "connect-src 'self'; " +
                                "frame-ancestors 'none'; " +
                                "base-uri 'self'; " +
                                "form-action 'self'"
                        )
                )
                // Referrer policy — do not leak full URL to third parties
                .referrerPolicy(referrer -> referrer
                        .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            )

            // ── Exception Handling ──────────────────────────────────────────────────
            .exceptionHandling(exceptions -> exceptions
                    .authenticationEntryPoint(restAuthenticationEntryPoint)
                    .accessDeniedHandler(restAccessDeniedHandler))

            // ── Authorization Rules ─────────────────────────────────────────────────
            .authorizeHttpRequests(auth -> auth
                    // Allow CORS preflight requests
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // Public auth endpoints
                    .requestMatchers("/auth/login", "/auth/register").permitAll()
                    // Public share download
                    .requestMatchers(HttpMethod.GET, "/share/**").permitAll()
                    // Swagger — only in dev; disable in prod by removing these
                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                    // Everything else requires authentication
                    .anyRequest().authenticated()
            )

            // ── JWT Filter ──────────────────────────────────────────────────────────
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // ── CSRF Cookie Filter (Force lazy CSRF token resolution for SPA) ────────
            .addFilterAfter(new CsrfCookieFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Strength 12 — higher than default (10)
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Support wildcard "*" for testing — allowedOriginPatterns is needed
        // because allowedOrigins("*") is incompatible with allowCredentials(true).
        // In production, set app.cors.allowed-origins to a specific domain list.
        if (allowedOriginsRaw.trim().equals("*")) {
            configuration.addAllowedOriginPattern("*");
        } else {
            List<String> allowedOrigins = List.of(allowedOriginsRaw.split(","))
                    .stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            configuration.setAllowedOrigins(allowedOrigins);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-XSRF-TOKEN",
                "X-Share-Password"
        ));
        configuration.setExposedHeaders(List.of("X-XSRF-TOKEN", "Content-Disposition", "ETag"));
        // Allow cookies — required for HttpOnly JWT cookie + CSRF cookie to be sent
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Filter that forces the generation/writing of the CSRF cookie for SPAs.
     * By default, Spring Security 6 defers CSRF token resolution until it is accessed.
     * Calling csrfToken.getToken() resolves it and writes the cookie immediately on early GET requests.
     */
    private static class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(
                HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain
        ) throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                csrfToken.getToken(); // Forces resolution and Set-Cookie header
            }
            filterChain.doFilter(request, response);
        }
    }
}
