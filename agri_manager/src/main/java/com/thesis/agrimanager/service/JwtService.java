package com.thesis.agrimanager.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    // Διαβάζει το κλειδί από το application.properties
    @Value("${jwt.secret.key}")
    private String secretKeyString;

    private static final long EXPIRATION_TIME = 86400000;

    // Μετατρέπει το String σε Key αντικείμενο
    // Βεβαιώσου ότι το όνομα είναι getSignKey (χωρίς το -ing)
    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKeyString);
        // Αν το string δεν είναι valid base64 (που το δικό σου δεν είναι),
        // χρησιμοποιούμε τα bytes του string απευθείας.
        try {
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            return Keys.hmacShaKeyFor(secretKeyString.getBytes());
        }
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }
}