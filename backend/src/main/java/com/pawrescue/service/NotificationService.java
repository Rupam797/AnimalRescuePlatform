package com.pawrescue.service;

import com.pawrescue.entity.AppNotification;
import com.pawrescue.repository.AppNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final AppNotificationRepository notificationRepository;

    public NotificationService(AppNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<AppNotification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead() {
        List<AppNotification> list = notificationRepository.findAll();
        for (AppNotification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
    }
}
