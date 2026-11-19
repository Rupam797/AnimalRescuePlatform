package com.pawrescue.repository;

import com.pawrescue.entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findAllByOrderByCreatedAtDesc();
    long countByIsReadFalse();
}
