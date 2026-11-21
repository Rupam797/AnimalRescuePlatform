package com.pawrescue.config;

import com.pawrescue.entity.*;
import com.pawrescue.model.*;
import com.pawrescue.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final RescueReportRepository reportRepository;
    private final ReportImageRepository reportImageRepository;
    private final RescueAssignmentRepository assignmentRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final AdoptionAnimalRepository adoptionAnimalRepository;
    private final AdoptionRequestRepository adoptionRequestRepository;
    private final AppNotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@pawrescue.org}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.name:System Administrator}")
    private String adminName;

    @Value("${app.admin.phone:+91-9876543210}")
    private String adminPhone;

    public DataInitializer(UserRepository userRepository,
                           RescueReportRepository reportRepository,
                           ReportImageRepository reportImageRepository,
                           RescueAssignmentRepository assignmentRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           AdoptionAnimalRepository adoptionAnimalRepository,
                           AdoptionRequestRepository adoptionRequestRepository,
                           AppNotificationRepository notificationRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.reportImageRepository = reportImageRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.adoptionAnimalRepository = adoptionAnimalRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Seed Administrator
        User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> {
            User newAdmin = new User(
                    adminName,
                    adminEmail,
                    adminPhone,
                    passwordEncoder.encode(adminPassword),
                    Role.ROLE_ADMIN,
                    true
            );
            return userRepository.save(newAdmin);
        });

        logger.info("Default Admin ready: {} ({})", admin.getEmail(), admin.getRole());

        // 2. Seed Volunteers and Users if empty
        if (userRepository.count() <= 1) {
            User vol1 = new User("Rahul Sharma", "rahul.volunteer@pawrescue.org", "+91-9888812345", passwordEncoder.encode("Volunteer@123"), Role.ROLE_VOLUNTEER, true);
            User vol2 = new User("Priya Deshmukh", "priya.volunteer@pawrescue.org", "+91-9888823456", passwordEncoder.encode("Volunteer@123"), Role.ROLE_VOLUNTEER, true);
            User vol3 = new User("Amit Kumar", "amit.pending@pawrescue.org", "+91-9888834567", passwordEncoder.encode("Volunteer@123"), Role.ROLE_VOLUNTEER, false); // Pending approval

            User user1 = new User("Ananya Sen", "ananya.citizen@gmail.com", "+91-9777712345", passwordEncoder.encode("User@123"), Role.ROLE_USER, true);
            User user2 = new User("Vikram Malhotra", "vikram.citizen@gmail.com", "+91-9777723456", passwordEncoder.encode("User@123"), Role.ROLE_USER, true);

            userRepository.saveAll(List.of(vol1, vol2, vol3, user1, user2));
            logger.info("Demo users and volunteers seeded successfully.");
        }

        // 3. Seed Reports and Lifecycles if empty
        if (reportRepository.count() == 0) {
            User citizen = userRepository.findByEmail("ananya.citizen@gmail.com").orElse(admin);
            User vol1 = userRepository.findByEmail("rahul.volunteer@pawrescue.org").orElse(admin);
            User vol2 = userRepository.findByEmail("priya.volunteer@pawrescue.org").orElse(admin);

            // Report 1: Under Treatment (dog rescued from Whitefield)
            RescueReport r1 = new RescueReport();
            r1.setReporter(citizen);
            r1.setAnimalType("Dog");
            r1.setAnimalName("Bruno");
            r1.setDescription("Found near Whitefield main road with a fractured right paw, severely limping and dehydrated.");
            r1.setSeverity(Severity.CRITICAL);
            r1.setLatitude(12.9698);
            r1.setLongitude(77.7499);
            r1.setAddress("ITPB Main Road, Whitefield, Bengaluru");
            r1.setLandmark("Opposite Forum Neighbourhood Mall");
            r1.setContactPhone("+91-9777712345");
            r1.setStatus(ReportStatus.UNDER_TREATMENT);
            r1.setCreatedAt(LocalDateTime.now().minusDays(2));
            r1 = reportRepository.save(r1);

            ReportImage img1 = new ReportImage(r1, "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80");
            reportImageRepository.save(img1);

            RescueAssignment a1 = new RescueAssignment(r1, vol1, admin, "Urgent rescue dispatch");
            assignmentRepository.save(a1);

            StatusHistory h1_1 = new StatusHistory(r1, null, ReportStatus.REPORTED, citizen, "Reported by citizen");
            StatusHistory h1_2 = new StatusHistory(r1, ReportStatus.REPORTED, ReportStatus.ASSIGNED, admin, "Assigned to Rahul Sharma");
            StatusHistory h1_3 = new StatusHistory(r1, ReportStatus.ASSIGNED, ReportStatus.RESCUED, vol1, "Animal secured safely and moved to vet clinic");
            StatusHistory h1_4 = new StatusHistory(r1, ReportStatus.RESCUED, ReportStatus.UNDER_TREATMENT, vol1, "Under orthopedic plaster treatment");
            statusHistoryRepository.saveAll(List.of(h1_1, h1_2, h1_3, h1_4));

            // Report 2: Recovered (ready to be listed for adoption)
            RescueReport r2 = new RescueReport();
            r2.setReporter(citizen);
            r2.setAnimalType("Cat");
            r2.setAnimalName("Luna");
            r2.setDescription("Young calico kitten rescued from a drainage pipe, completely recovered and vaccinated.");
            r2.setSeverity(Severity.MEDIUM);
            r2.setLatitude(12.9784);
            r2.setLongitude(77.6408);
            r2.setAddress("100 Feet Road, Indiranagar, Bengaluru");
            r2.setLandmark("Near Metro Station");
            r2.setContactPhone("+91-9777712345");
            r2.setStatus(ReportStatus.RECOVERED);
            r2.setCreatedAt(LocalDateTime.now().minusDays(4));
            r2 = reportRepository.save(r2);

            ReportImage img2 = new ReportImage(r2, "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80");
            reportImageRepository.save(img2);

            RescueAssignment a2 = new RescueAssignment(r2, vol2, admin, "Kitten rescue");
            assignmentRepository.save(a2);

            StatusHistory h2_1 = new StatusHistory(r2, null, ReportStatus.REPORTED, citizen, "Reported");
            StatusHistory h2_2 = new StatusHistory(r2, ReportStatus.REPORTED, ReportStatus.ASSIGNED, admin, "Assigned to Priya");
            StatusHistory h2_3 = new StatusHistory(r2, ReportStatus.ASSIGNED, ReportStatus.RESCUED, vol2, "Rescued");
            StatusHistory h2_4 = new StatusHistory(r2, ReportStatus.RESCUED, ReportStatus.RECOVERED, vol2, "Fully vaccinated & healthy");
            statusHistoryRepository.saveAll(List.of(h2_1, h2_2, h2_3, h2_4));

            // Report 3: Fresh Reported (needs assignment)
            RescueReport r3 = new RescueReport();
            r3.setReporter(citizen);
            r3.setAnimalType("Puppy");
            r3.setAnimalName("Charlie");
            r3.setDescription("Small stray puppy shivering in the rain with mild skin allergy.");
            r3.setSeverity(Severity.LOW);
            r3.setLatitude(12.9121);
            r3.setLongitude(77.6446);
            r3.setAddress("Sector 2, HSR Layout, Bengaluru");
            r3.setLandmark("Near BDA Complex");
            r3.setContactPhone("+91-9777712345");
            r3.setStatus(ReportStatus.REPORTED);
            r3.setCreatedAt(LocalDateTime.now().minusHours(3));
            r3 = reportRepository.save(r3);

            ReportImage img3 = new ReportImage(r3, "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&q=80");
            reportImageRepository.save(img3);

            StatusHistory h3_1 = new StatusHistory(r3, null, ReportStatus.REPORTED, citizen, "New report filed");
            statusHistoryRepository.save(h3_1);

            logger.info("Demo rescue reports and lifecycles seeded successfully.");
        }

        // 4. Seed Adoptable Animals if empty
        if (adoptionAnimalRepository.count() == 0) {
            AdoptionAnimal a1 = new AdoptionAnimal();
            a1.setName("Rocky");
            a1.setSpecies("Dog");
            a1.setBreed("Golden Retriever Mix");
            a1.setAge("2 years");
            a1.setGender("Male");
            a1.setHealthNotes("Neutered, fully vaccinated, dewormed. Very friendly and gentle with children.");
            a1.setDescription("Rocky is a loyal, calm companion who loves morning walks and belly rubs. He was rehabilitated after a road accident and is now in top health!");
            a1.setPhotoUrl("https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80");
            a1.setStatus(AdoptionStatus.AVAILABLE);

            AdoptionAnimal a2 = new AdoptionAnimal();
            a2.setName("Mochi");
            a2.setSpecies("Cat");
            a2.setBreed("Calico / Domestic Short Hair");
            a2.setAge("1 year");
            a2.setGender("Female");
            a2.setHealthNotes("Spayed, up to date on all feline shots, litter-trained.");
            a2.setDescription("Mochi is an inquisitive, purring sweetheart who loves sunny windowsills and feather toys. Perfect for apartment living.");
            a2.setPhotoUrl("https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&q=80");
            a2.setStatus(AdoptionStatus.AVAILABLE);

            AdoptionAnimal a3 = new AdoptionAnimal();
            a3.setName("Daisy");
            a3.setSpecies("Dog");
            a3.setBreed("Indian Pariah / Indie");
            a3.setAge("6 months");
            a3.setGender("Female");
            a3.setHealthNotes("Vaccinated, energetic, high immunity indie pup.");
            a3.setDescription("Daisy is an intelligent and playful Indie pup who learns tricks in minutes. She is super affectionate and looking for a loving forever home.");
            a3.setPhotoUrl("https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80");
            a3.setStatus(AdoptionStatus.AVAILABLE);

            adoptionAnimalRepository.saveAll(List.of(a1, a2, a3));

            // Demo Adoption Request
            User applicant = userRepository.findByEmail("vikram.citizen@gmail.com").orElse(admin);
            AdoptionRequest req = new AdoptionRequest(a1, applicant, "I have a spacious house with a secure garden and work from home. Would love to give Rocky a loving home!", "+91-9777723456");
            adoptionRequestRepository.save(req);

            logger.info("Demo adoptable animals and requests seeded successfully.");
        }

        // 4b. Ensure at least one demo adopted record exists for reporting
        if (adoptionAnimalRepository.countByStatus(AdoptionStatus.ADOPTED) == 0) {
            User adopterUser = userRepository.findByEmail("ananya.citizen@gmail.com").orElse(admin);
            AdoptionAnimal a4 = new AdoptionAnimal();
            a4.setName("Luna");
            a4.setSpecies("Dog");
            a4.setBreed("Labrador Mix");
            a4.setAge("2 years");
            a4.setGender("Female");
            a4.setHealthNotes("Healthy, spayed, fully vaccinated.");
            a4.setDescription("Luna was rescued after a road injury and made a full recovery. Adopted by Ananya!");
            a4.setPhotoUrl("https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80");
            a4.setStatus(AdoptionStatus.ADOPTED);
            a4.setPublishedAt(LocalDateTime.now().minusMonths(1).minusDays(10));
            a4.setAdoptedAt(LocalDateTime.now().minusDays(5));
            adoptionAnimalRepository.save(a4);

            AdoptionRequest req4 = new AdoptionRequest(a4, adopterUser, "We adopted Luna and she is flourishing in our home!", "+91-9777712345");
            req4.setStatus(AdoptionRequestStatus.APPROVED);
            adoptionRequestRepository.save(req4);
        }

        // 5. Seed sample notifications
        if (notificationRepository.count() == 0) {
            notificationRepository.save(new AppNotification("Welcome to Animal Rescue Platform", "System initialized and ready.", "SYSTEM", null));
            notificationRepository.save(new AppNotification("Urgent Case Reported", "Case #1 (Bruno) in Whitefield needs treatment review.", "RESCUE", 1L));
        }
    }
}
