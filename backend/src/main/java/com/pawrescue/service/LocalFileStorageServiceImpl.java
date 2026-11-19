package com.pawrescue.service;

import com.pawrescue.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalFileStorageServiceImpl implements FileStorageService {

    private final Path uploadDirectory;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public LocalFileStorageServiceImpl(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directory: " + uploadDir, e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Image size must not exceed 5 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file format. Only JPG, PNG, and WebP images are allowed.");
        }

        String extension = ".jpg";
        if (contentType.equalsIgnoreCase("image/png")) {
            extension = ".png";
        } else if (contentType.equalsIgnoreCase("image/webp")) {
            extension = ".webp";
        }

        String fileName = UUID.randomUUID() + extension;
        Path targetLocation = this.uploadDirectory.resolve(fileName).normalize();

        if (!targetLocation.startsWith(this.uploadDirectory)) {
            throw new BadRequestException("Cannot store file outside target directory");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + fileName, ex);
        }
    }
}
