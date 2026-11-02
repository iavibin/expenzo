package com.expensetracker.api;

import com.expensetracker.model.User;
import com.sun.net.httpserver.HttpExchange;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class SessionManager {
    public static class UserSession {
        private final String token;
        private final int userId;
        private final String name;
        private final String email;
        private final long createdAt;

        public UserSession(String token, int userId, String name, String email) {
            this.token = token;
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.createdAt = System.currentTimeMillis();
        }

        public String getToken() {
            return token;
        }

        public int getUserId() {
            return userId;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }

        public long getCreatedAt() {
            return createdAt;
        }
    }

    private static final Map<String, UserSession> SESSIONS = new ConcurrentHashMap<>();

    public static UserSession createSession(User user) {
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession(token, user.getUserId(), user.getName(), user.getEmail());
        SESSIONS.put(token, session);
        return session;
    }

    public static UserSession getSession(String token) {
        if (token == null) return null;
        return SESSIONS.get(token);
    }

    public static void invalidateSession(String token) {
        if (token != null) {
            SESSIONS.remove(token);
        }
    }

    public static UserSession authenticate(HttpExchange exchange) {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            return getSession(token);
        }
        return null;
    }
}

