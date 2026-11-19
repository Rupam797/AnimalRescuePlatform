package com.pawrescue.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {

    private long totalReports;
    private long activeCases;
    private long rescuedCount;
    private long inTreatmentCount;
    private long readyForAdoptionCount;
    private long adoptedCount;
    private long volunteersCount;
    private Map<String, Long> reportsByType;
    private Map<String, Long> reportsByStatus;
    private List<Map<String, Object>> reportsByDay;

    public DashboardStatsResponse() {
    }

    public long getTotalReports() {
        return totalReports;
    }

    public void setTotalReports(long totalReports) {
        this.totalReports = totalReports;
    }

    public long getActiveCases() {
        return activeCases;
    }

    public void setActiveCases(long activeCases) {
        this.activeCases = activeCases;
    }

    public long getRescuedCount() {
        return rescuedCount;
    }

    public void setRescuedCount(long rescuedCount) {
        this.rescuedCount = rescuedCount;
    }

    public long getInTreatmentCount() {
        return inTreatmentCount;
    }

    public void setInTreatmentCount(long inTreatmentCount) {
        this.inTreatmentCount = inTreatmentCount;
    }

    public long getReadyForAdoptionCount() {
        return readyForAdoptionCount;
    }

    public void setReadyForAdoptionCount(long readyForAdoptionCount) {
        this.readyForAdoptionCount = readyForAdoptionCount;
    }

    public long getAdoptedCount() {
        return adoptedCount;
    }

    public void setAdoptedCount(long adoptedCount) {
        this.adoptedCount = adoptedCount;
    }

    public long getVolunteersCount() {
        return volunteersCount;
    }

    public void setVolunteersCount(long volunteersCount) {
        this.volunteersCount = volunteersCount;
    }

    public Map<String, Long> getReportsByType() {
        return reportsByType;
    }

    public void setReportsByType(Map<String, Long> reportsByType) {
        this.reportsByType = reportsByType;
    }

    public Map<String, Long> getReportsByStatus() {
        return reportsByStatus;
    }

    public void setReportsByStatus(Map<String, Long> reportsByStatus) {
        this.reportsByStatus = reportsByStatus;
    }

    public List<Map<String, Object>> getReportsByDay() {
        return reportsByDay;
    }

    public void setReportsByDay(List<Map<String, Object>> reportsByDay) {
        this.reportsByDay = reportsByDay;
    }
}
