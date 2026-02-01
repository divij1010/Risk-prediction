def explain_risk(attendance_trend, assignment_delay_avg, marks_std, engagement_score):
    reasons = []

    if attendance_trend < -5:
        reasons.append("Significant drop in attendance")

    if assignment_delay_avg > 3:
        reasons.append("Frequent assignment submission delays")

    if marks_std > 15:
        reasons.append("Inconsistent academic performance")

    if engagement_score < 0.3:
        reasons.append("Low LMS engagement")

    if not reasons:
        reasons.append("All parameters are within safe range")

    return reasons
