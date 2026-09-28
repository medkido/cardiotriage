import { FlagDef, RiskTier, TriageResult } from "./types";

/**
 * Flag checklist transcribed directly from:
 * "Differentiating Features: Cardiac vs. Psychosomatic Chest Pain"
 *
 * Any single cardiac flag present -> HIGH risk tier (urgent cardiology
 * evaluation), regardless of how many reassuring flags are also present.
 * This mirrors the source guideline's approach: red flags are ruled OUT
 * one at a time, not outvoted by reassuring findings.
 */
export const CARDIAC_FLAGS: FlagDef[] = [
  // History
  { id: "c_exertional_pain", group: "cardiacHistory", label: "Chest pain during or immediately after moderate-high intensity exercise" },
  { id: "c_exertional_syncope", group: "cardiacHistory", label: "Exertional syncope, presyncope, or collapse" },
  { id: "c_palpitations", group: "cardiacHistory", label: "Chest pain accompanied by palpitations" },
  { id: "c_personal_hx", group: "cardiacHistory", label: "Personal history: congenital/acquired heart disease, cardiac surgery in the last 2 weeks, Kawasaki disease with aneurysms, connective tissue disorder (Marfan, Ehlers-Danlos, SLE), sickle cell disease, or a hypercoagulable state" },
  { id: "c_family_hx", group: "cardiacHistory", label: "Family history: sudden unexplained death under age 35, cardiomyopathy, inherited arrhythmia (Long QT, Brugada), or aortic dissection in a first-degree relative" },
  { id: "c_drug_use", group: "cardiacHistory", label: "Drug use: cocaine, amphetamines, or chronic alcohol excess" },
  { id: "c_recent_vaccine", group: "cardiacHistory", label: "Recent mRNA COVID-19 vaccination (0-14 days), especially after a second dose in an adolescent male" },

  // Pain characteristics
  { id: "c_crushing_pain", group: "cardiacPain", label: "Crushing, heavy, or pressure-like central chest pain" },
  { id: "c_radiation", group: "cardiacPain", label: "Pain radiates to left arm, jaw, neck, or back" },
  { id: "c_autonomic", group: "cardiacPain", label: "Associated autonomic symptoms: sweating, pallor, nausea, dyspnea" },
  { id: "c_no_resp_change", group: "cardiacPain", label: "Pain does not change with respiration or palpation" },
  { id: "c_exercise_pattern", group: "cardiacPain", label: "Worsens with exercise, improves with rest" },

  // Exam
  { id: "c_murmur", group: "cardiacExam", label: "Pathological or new heart murmur (especially a systolic murmur at the right upper sternal edge)" },
  { id: "c_rub", group: "cardiacExam", label: "Pericardial rub" },
  { id: "c_hf_signs", group: "cardiacExam", label: "Signs of heart failure: tachycardia, elevated JVP, hepatomegaly, peripheral edema, gallop rhythm" },
  { id: "c_abnormal_vitals", group: "cardiacExam", label: "Abnormal vital signs: persistent tachycardia, hypotension, hypoxemia, or fever above 38.5C" },
  { id: "c_marfanoid", group: "cardiacExam", label: "Marfanoid habitus: tall, slender, arachnodactyly, pectus deformity" },
  { id: "c_abnormal_ecg", group: "cardiacExam", label: "Abnormal ECG: ST elevation/depression, prolonged QTc (>500ms), arrhythmia, LVH, or pathological Q waves" }
];

export const REASSURING_FLAGS: FlagDef[] = [
  // History
  { id: "r_stressors", group: "reassuringHistory", label: "Recent or current stressful situations (family illness, academic pressure, relationship problems, life events)" },
  { id: "r_anxiety_hx", group: "reassuringHistory", label: "History of anxiety disorder (especially panic disorder), depression, or other mental illness" },
  { id: "r_hyperventilation", group: "reassuringHistory", label: "Hyperventilation episodes" },
  { id: "r_somatic", group: "reassuringHistory", label: "Associated somatic complaints: headaches, abdominal pain, sleep disturbance" },
  { id: "r_demographic", group: "reassuringHistory", label: "Female and adolescent (over age 12)" },
  { id: "r_recurrent_stressor", group: "reassuringHistory", label: "Recurrent episodes tied to particular stressors" },

  // Pain characteristics
  { id: "r_tightness", group: "reassuringPain", label: "\"Tightness\" or band-like sensation across the chest" },
  { id: "r_poorly_localized", group: "reassuringPain", label: "Poorly localized or shifting location" },
  { id: "r_episodic", group: "reassuringPain", label: "Recurrent, episodic pattern" },
  { id: "r_not_exertional", group: "reassuringPain", label: "Not related to exertion; may occur at rest or during emotional stress" },
  { id: "r_variable_duration", group: "reassuringPain", label: "Variable duration: minutes to hours" },
  { id: "r_anxiety_symptoms", group: "reassuringPain", label: "Associated with anxiety symptoms: palpitations without arrhythmia, shortness of breath, dizziness, tingling/paresthesias" },

  // Exam
  { id: "r_normal_cv_exam", group: "reassuringExam", label: "Normal cardiovascular exam: no murmurs, rubs, or signs of heart failure" },
  { id: "r_normal_vitals", group: "reassuringExam", label: "Normal vital signs (may have anxiety-related tachycardia but no hypotension/hypoxemia)" },
  { id: "r_anxiety_signs", group: "reassuringExam", label: "Signs of anxiety: tremor, sweating, rapid shallow breathing, sighing respirations" },
  { id: "r_wall_tenderness", group: "reassuringExam", label: "Reproducible chest wall tenderness (musculoskeletal pain often overlaps with psychogenic)" },
  { id: "r_normal_ecg", group: "reassuringExam", label: "Normal ECG (no ST changes, arrhythmias, or QT prolongation)" }
];

export function computeTriage(selectedIds: string[]): TriageResult {
  const selected = new Set(selectedIds);

  const cardiacFlagsMatched = CARDIAC_FLAGS.filter((f) => selected.has(f.id));
  const reassuringFlagsMatched = REASSURING_FLAGS.filter((f) => selected.has(f.id));

  let tier: RiskTier;
  let headline: string;
  let recommendation: string;

  if (cardiacFlagsMatched.length > 0) {
    tier = "high";
    headline = "Cardiac red flag present";
    recommendation =
      "At least one cardiac red flag was identified. Guideline pathways treat any single red flag as sufficient to warrant urgent evaluation, regardless of how benign other features look. Recommend same-day clinical assessment, ECG, and cardiology consultation or emergency evaluation as clinically indicated. Do not defer on the basis of reassuring findings elsewhere in the history.";
  } else if (reassuringFlagsMatched.length >= 3) {
    tier = "low";
    headline = "No cardiac red flags; features consistent with non-cardiac / psychosomatic origin";
    recommendation =
      "No cardiac red flags were identified, and multiple features consistent with musculoskeletal or psychogenic chest pain are present. Guideline literature supports reassurance and routine follow-up without further cardiac workup in this pattern. Provide a clear safety-net: return promptly if exertional pain, syncope, palpitations, or new exam findings develop.";
  } else {
    tier = "indeterminate";
    headline = "No cardiac red flags, but the picture is not clearly reassuring";
    recommendation =
      "No cardiac red flags were identified, but there are not yet enough reassuring features to confidently classify this as non-cardiac. Recommend routine clinical follow-up, consider baseline ECG if not already done, and revisit the history for any missed red flags before finalizing reassurance.";
  }

  return { tier, cardiacFlagsMatched, reassuringFlagsMatched, headline, recommendation };
}
