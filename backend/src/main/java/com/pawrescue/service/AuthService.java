package com.pawrescue.service;

import com.pawrescue.dto.AuthResponse;
import com.pawrescue.dto.LoginRequest;
import com.pawrescue.dto.SignupRequest;
import com.pawrescue.dto.UserResponse;
import com.pawrescue.entity.AppNotification;
import com.pawrescue.entity.User;
import com.pawrescue.exception.BadRequestException;
import com.pawrescue.exception.ResourceNotFoundException;
import com.pawrescue.exception.UnauthorizedException;
import com.pawrescue.model.Role;
import com.pawrescue.repository.AppNotificationRepository;
import com.pawrescue.repository.UserRepository;
import com.pawrescue.security.JwtUtils;
import com.pawrescue.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AppNotificationRepository notificationRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtils jwtUtils,
                       AppNotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        Role requestedRole = request.getRole() != null ? request.getRole() : Role.ROLE_USER;
        if (requestedRole == Role.ROLE_ADMIN) {
            throw new BadRequestException("Cannot register directly as an Administrator");
        }

        // Volunteers require admin approval before login
        boolean approved = (requestedRole != Role.ROLE_VOLUNTEER);

        User user = new User(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                request.getPhone() != null ? request.getPhone().trim() : null,
                passwordEncoder.encode(request.getPassword()),
                requestedRole,
                approved
        );

        User savedUser = userRepository.save(user);

        // Notify admins if a new volunteer registered
        if (requestedRole == Role.ROLE_VOLUNTEER) {
            AppNotification notification = new AppNotification(
                    "New Volunteer Registration",
                    savedUser.getName() + " signed up as a volunteer and is awaiting approval.",
                    "VOLUNTEER",
                    null
            );
            notificationRepository.save(notification);

            return new AuthResponse(
                    null,
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail(),
                    savedUser.getPhone(),
                    savedUser.getRole(),
                    false
            );
        }

        String jwt = jwtUtils.generateTokenFromUsername(
                savedUser.getEmail(),
                savedUser.getId(),
                savedUser.getRole().name(),
                savedUser.getName()
        );

        return new AuthResponse(
                jwt,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                true
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("Your account has been deactivated. Please contact support.");
        }

        if (user.getRole() == Role.ROLE_VOLUNTEER && !user.isApproved()) {
            throw new UnauthorizedException("Your volunteer account is pending approval by the administrator.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtils.generateJwtToken(authentication);

        return new AuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getName(),
                userPrincipal.getUsername(),
                userPrincipal.getPhone(),
                userPrincipal.getRole(),
                userPrincipal.isApproved()
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl principal)) {
            throw new UnauthorizedException("Not authenticated");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return UserResponse.fromEntity(user);
    }
}
