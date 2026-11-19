package com.pawrescue.model;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum ReportStatus {
    REPORTED,
    ASSIGNED,
    RESCUED,
    UNDER_TREATMENT,
    RECOVERED,
    LISTED_FOR_ADOPTION,
    ADOPTED,
    CANCELLED,
    NOT_FOUND;

    private static final Map<ReportStatus, Set<ReportStatus>> VOLUNTEER_TRANSITIONS = Map.of(
            REPORTED, EnumSet.of(ASSIGNED),
            ASSIGNED, EnumSet.of(RESCUED, NOT_FOUND),
            RESCUED, EnumSet.of(UNDER_TREATMENT, RECOVERED),
            UNDER_TREATMENT, EnumSet.of(RECOVERED)
    );

    private static final Map<ReportStatus, Set<ReportStatus>> ADMIN_TRANSITIONS = Map.of(
            REPORTED, EnumSet.of(ASSIGNED, CANCELLED, NOT_FOUND),
            ASSIGNED, EnumSet.of(RESCUED, CANCELLED, NOT_FOUND),
            RESCUED, EnumSet.of(UNDER_TREATMENT, RECOVERED, CANCELLED),
            UNDER_TREATMENT, EnumSet.of(RECOVERED, CANCELLED),
            RECOVERED, EnumSet.of(LISTED_FOR_ADOPTION, CANCELLED),
            LISTED_FOR_ADOPTION, EnumSet.of(ADOPTED, CANCELLED),
            ADOPTED, Collections.emptySet(),
            CANCELLED, Collections.emptySet(),
            NOT_FOUND, EnumSet.of(ASSIGNED, REPORTED)
    );

    public boolean canTransitionTo(ReportStatus target, boolean isAdmin) {
        if (this == target) {
            return true;
        }
        if (isAdmin) {
            Set<ReportStatus> allowed = ADMIN_TRANSITIONS.getOrDefault(this, Collections.emptySet());
            return allowed.contains(target);
        } else {
            Set<ReportStatus> allowed = VOLUNTEER_TRANSITIONS.getOrDefault(this, Collections.emptySet());
            return allowed.contains(target);
        }
    }
}
