export type BodyGender = 'male' | 'female'

export type BodyZoneId =
  | 'head' | 'neck'
  | 'chest' | 'abdomen' | 'upper_back' | 'lower_back'
  | 'shoulder_L' | 'shoulder_R'
  | 'upper_arm_L' | 'upper_arm_R'
  | 'forearm_L' | 'forearm_R'
  | 'hand_L' | 'hand_R'
  | 'hips'
  | 'thigh_L' | 'thigh_R'
  | 'shin_L' | 'shin_R'
  | 'foot_L' | 'foot_R'

export interface ZoneInfo {
  id: BodyZoneId
  label: string
  labelRu: string
  short: string
}

export const ZONE_INFO: Record<BodyZoneId, ZoneInfo> = {
  head:       { id: 'head',       label: 'Head',         labelRu: 'Голова',              short: 'Голова' },
  neck:       { id: 'neck',       label: 'Neck',         labelRu: 'Шея',                 short: 'Шея' },
  chest:      { id: 'chest',      label: 'Chest',        labelRu: 'Грудь',               short: 'Грудь' },
  abdomen:    { id: 'abdomen',    label: 'Abdomen',      labelRu: 'Живот',               short: 'Живот' },
  upper_back: { id: 'upper_back', label: 'Upper Back',   labelRu: 'Верхняя спина',       short: 'В.Спина' },
  lower_back: { id: 'lower_back', label: 'Lower Back',   labelRu: 'Нижняя спина',        short: 'Н.Спина' },
  hips:       { id: 'hips',       label: 'Hips',         labelRu: 'Бёдра',               short: 'Бёдра' },
  shoulder_L: { id: 'shoulder_L', label: 'Left Shoulder',  labelRu: 'Левое плечо',       short: 'Л.Плечо' },
  shoulder_R: { id: 'shoulder_R', label: 'Right Shoulder', labelRu: 'Правое плечо',      short: 'П.Плечо' },
  upper_arm_L:{ id: 'upper_arm_L',label: 'Left Upper Arm', labelRu: 'Левая рука',        short: 'Л.Рука' },
  upper_arm_R:{ id: 'upper_arm_R',label: 'Right Upper Arm',labelRu: 'Правая рука',       short: 'П.Рука' },
  forearm_L:  { id: 'forearm_L',  label: 'Left Forearm', labelRu: 'Левое предплечье',    short: 'Л.Предпл' },
  forearm_R:  { id: 'forearm_R',  label: 'Right Forearm',labelRu: 'Правое предплечье',   short: 'П.Предпл' },
  hand_L:     { id: 'hand_L',     label: 'Left Hand',    labelRu: 'Левая кисть',         short: 'Л.Кисть' },
  hand_R:     { id: 'hand_R',     label: 'Right Hand',   labelRu: 'Правая кисть',        short: 'П.Кисть' },
  thigh_L:    { id: 'thigh_L',    label: 'Left Thigh',   labelRu: 'Левое бедро',         short: 'Л.Бедро' },
  thigh_R:    { id: 'thigh_R',    label: 'Right Thigh',  labelRu: 'Правое бедро',        short: 'П.Бедро' },
  shin_L:     { id: 'shin_L',     label: 'Left Shin',    labelRu: 'Левая голень',        short: 'Л.Голень' },
  shin_R:     { id: 'shin_R',     label: 'Right Shin',   labelRu: 'Правая голень',       short: 'П.Голень' },
  foot_L:     { id: 'foot_L',     label: 'Left Foot',    labelRu: 'Левая стопа',         short: 'Л.Стопа' },
  foot_R:     { id: 'foot_R',     label: 'Right Foot',   labelRu: 'Правая стопа',        short: 'П.Стопа' },
}

export const TORSO_ZONE_IDS: BodyZoneId[] = [
  'head', 'neck', 'chest', 'abdomen', 'hips', 'upper_back', 'lower_back',
]

export const LIMB_ZONE_IDS: BodyZoneId[] = [
  'shoulder_L', 'shoulder_R',
  'upper_arm_L', 'upper_arm_R',
  'forearm_L', 'forearm_R',
  'hand_L', 'hand_R',
  'thigh_L', 'thigh_R',
  'shin_L', 'shin_R',
  'foot_L', 'foot_R',
]

// ── Male (Rigify DEF- bones) ──────────────────────────────────────────────
const MALE_MAP: Record<string, BodyZoneId> = {
  // Head / neck
  'DEF-forehead.L': 'head', 'DEF-forehead.R': 'head',
  'DEF-forehead.L.001': 'head', 'DEF-forehead.R.001': 'head',
  'DEF-forehead.L.002': 'head', 'DEF-forehead.R.002': 'head',
  'DEF-temple.L': 'head', 'DEF-temple.R': 'head',
  'DEF-cheek.T.L': 'head', 'DEF-cheek.T.R': 'head',
  'DEF-cheek.B.L': 'head', 'DEF-cheek.B.R': 'head',
  'DEF-nose': 'head', 'DEF-nose.L': 'head', 'DEF-nose.R': 'head',
  'DEF-nose.001': 'head', 'DEF-nose.002': 'head', 'DEF-nose.003': 'head', 'DEF-nose.004': 'head',
  'DEF-nose.L.001': 'head', 'DEF-nose.R.001': 'head',
  'DEF-chin': 'head', 'DEF-chin.001': 'head', 'DEF-chin.L': 'head', 'DEF-chin.R': 'head',
  'DEF-jaw': 'head', 'DEF-jaw.L': 'head', 'DEF-jaw.R': 'head',
  'DEF-jaw.L.001': 'head', 'DEF-jaw.R.001': 'head',
  'DEF-cheek.T.L.001': 'head', 'DEF-cheek.T.R.001': 'head',
  'DEF-cheek.B.L.001': 'head', 'DEF-cheek.B.R.001': 'head',
  'DEF-brow.B.L': 'head', 'DEF-brow.B.R': 'head',
  'DEF-brow.B.L.001': 'head', 'DEF-brow.B.R.001': 'head',
  'DEF-brow.B.L.002': 'head', 'DEF-brow.B.R.002': 'head',
  'DEF-brow.B.L.003': 'head', 'DEF-brow.B.R.003': 'head',
  'DEF-brow.T.L': 'head', 'DEF-brow.T.R': 'head',
  'DEF-brow.T.L.001': 'head', 'DEF-brow.T.R.001': 'head',
  'DEF-brow.T.L.002': 'head', 'DEF-brow.T.R.002': 'head',
  'DEF-brow.T.L.003': 'head', 'DEF-brow.T.R.003': 'head',
  'DEF-lip.T.L': 'head', 'DEF-lip.T.R': 'head',
  'DEF-lip.B.L': 'head', 'DEF-lip.B.R': 'head',
  'DEF-lip.T.L.001': 'head', 'DEF-lip.T.R.001': 'head',
  'DEF-lip.B.L.001': 'head', 'DEF-lip.B.R.001': 'head',
  'DEF-ear.L': 'head', 'DEF-ear.R': 'head',
  'DEF-ear.L.001': 'head', 'DEF-ear.R.001': 'head',
  'DEF-ear.L.002': 'head', 'DEF-ear.R.002': 'head',
  'DEF-ear.L.003': 'head', 'DEF-ear.R.003': 'head',
  'DEF-ear.L.004': 'head', 'DEF-ear.R.004': 'head',

  'DEF-spine.006': 'neck',

  // Torso
  'DEF-spine.003': 'chest', 'DEF-spine.004': 'chest',
  'DEF-breast.L': 'chest', 'DEF-breast.R': 'chest',
  'DEF-breast_twist.L': 'chest', 'DEF-breast_twist.R': 'chest',
  'DEF-spine.001': 'abdomen', 'DEF-spine.002': 'abdomen',
  'DEF-spine.005': 'upper_back',
  'DEF-spine': 'lower_back', 'DEF-pelvis': 'lower_back',

  // Arms
  'DEF-shoulder.L': 'shoulder_L',
  'DEF-shoulder.R': 'shoulder_R',
  'DEF-upper_arm.L': 'upper_arm_L', 'DEF-upper_arm.L.001': 'upper_arm_L',
  'DEF-upper_arm.R': 'upper_arm_R', 'DEF-upper_arm.R.001': 'upper_arm_R',
  'DEF-forearm.L': 'forearm_L', 'DEF-forearm.L.001': 'forearm_L',
  'DEF-forearm.R': 'forearm_R', 'DEF-forearm.R.001': 'forearm_R',
  'DEF-hand.L': 'hand_L',
  'DEF-palm.01.L': 'hand_L', 'DEF-palm.02.L': 'hand_L',
  'DEF-palm.03.L': 'hand_L', 'DEF-palm.04.L': 'hand_L',
  'DEF-f_index.01.L': 'hand_L', 'DEF-f_index.02.L': 'hand_L', 'DEF-f_index.03.L': 'hand_L',
  'DEF-f_middle.01.L': 'hand_L', 'DEF-f_middle.02.L': 'hand_L', 'DEF-f_middle.03.L': 'hand_L',
  'DEF-f_ring.01.L': 'hand_L', 'DEF-f_ring.02.L': 'hand_L', 'DEF-f_ring.03.L': 'hand_L',
  'DEF-f_pinky.01.L': 'hand_L', 'DEF-f_pinky.02.L': 'hand_L', 'DEF-f_pinky.03.L': 'hand_L',
  'DEF-thumb.01.L': 'hand_L', 'DEF-thumb.02.L': 'hand_L', 'DEF-thumb.03.L': 'hand_L',
  'DEF-hand.R': 'hand_R',
  'DEF-palm.01.R': 'hand_R', 'DEF-palm.02.R': 'hand_R',
  'DEF-palm.03.R': 'hand_R', 'DEF-palm.04.R': 'hand_R',
  'DEF-f_index.01.R': 'hand_R', 'DEF-f_index.02.R': 'hand_R', 'DEF-f_index.03.R': 'hand_R',
  'DEF-f_middle.01.R': 'hand_R', 'DEF-f_middle.02.R': 'hand_R', 'DEF-f_middle.03.R': 'hand_R',
  'DEF-f_ring.01.R': 'hand_R', 'DEF-f_ring.02.R': 'hand_R', 'DEF-f_ring.03.R': 'hand_R',
  'DEF-f_pinky.01.R': 'hand_R', 'DEF-f_pinky.02.R': 'hand_R', 'DEF-f_pinky.03.R': 'hand_R',
  'DEF-thumb.01.R': 'hand_R', 'DEF-thumb.02.R': 'hand_R', 'DEF-thumb.03.R': 'hand_R',

  // Legs
  'DEF-thigh.L': 'thigh_L', 'DEF-thigh.L.001': 'thigh_L',
  'DEF-thigh.R': 'thigh_R', 'DEF-thigh.R.001': 'thigh_R',
  'DEF-shin.L': 'shin_L', 'DEF-shin.L.001': 'shin_L',
  'DEF-shin.R': 'shin_R', 'DEF-shin.R.001': 'shin_R',
  'DEF-foot.L': 'foot_L', 'DEF-toe.L': 'foot_L',
  'DEF-foot.R': 'foot_R', 'DEF-toe.R': 'foot_R',
  'DEF-knee_share.L': 'shin_L', 'DEF-knee_share.R': 'shin_R',
  'DEF-elbow_share.L': 'forearm_L', 'DEF-elbow_share.R': 'forearm_R',
}

// ── Female (CC_Base bones) ────────────────────────────────────────────────
const FEMALE_MAP: Record<string, BodyZoneId> = {
  // Head
  'CC_Base_Head': 'head', 'CC_Base_FacialBone': 'head',
  'CC_Base_JawRoot': 'head', 'CC_Base_UpperJaw': 'head',
  'CC_Base_Teeth01': 'head', 'CC_Base_Teeth02': 'head',
  'CC_Base_Tongue01': 'head', 'CC_Base_Tongue02': 'head', 'CC_Base_Tongue03': 'head',
  'CC_Base_R_Eye': 'head', 'CC_Base_L_Eye': 'head',

  // Neck
  'CC_Base_NeckTwist01': 'neck', 'CC_Base_NeckTwist02': 'neck',

  // Torso
  'CC_Base_Spine02': 'chest',
  'CC_Base_L_Breast': 'chest', 'CC_Base_R_Breast': 'chest',
  'CC_Base_L_RibsTwist': 'chest', 'CC_Base_R_RibsTwist': 'chest',
  'CC_Base_Spine01': 'abdomen', 'CC_Base_Waist': 'abdomen',
  'CC_Base_Hip': 'hips', 'CC_Base_Pelvis': 'hips',

  // Arms
  'CC_Base_L_Clavicle': 'shoulder_L',
  'CC_Base_R_Clavicle': 'shoulder_R',
  'CC_Base_L_Upperarm': 'upper_arm_L',
  'CC_Base_L_UpperarmTwist01': 'upper_arm_L', 'CC_Base_L_UpperarmTwist02': 'upper_arm_L',
  'CC_Base_R_Upperarm': 'upper_arm_R',
  'CC_Base_R_UpperarmTwist01': 'upper_arm_R', 'CC_Base_R_UpperarmTwist02': 'upper_arm_R',
  'CC_Base_L_Forearm': 'forearm_L',
  'CC_Base_L_ForearmTwist01': 'forearm_L', 'CC_Base_L_ForearmTwist02': 'forearm_L',
  'CC_Base_L_ElbowShareBone': 'forearm_L',
  'CC_Base_R_Forearm': 'forearm_R',
  'CC_Base_R_ForearmTwist01': 'forearm_R', 'CC_Base_R_ForearmTwist02': 'forearm_R',
  'CC_Base_R_ElbowShareBone': 'forearm_R',
  'CC_Base_L_Hand': 'hand_L',
  'CC_Base_L_Index1': 'hand_L', 'CC_Base_L_Index2': 'hand_L', 'CC_Base_L_Index3': 'hand_L',
  'CC_Base_L_Mid1': 'hand_L', 'CC_Base_L_Mid2': 'hand_L', 'CC_Base_L_Mid3': 'hand_L',
  'CC_Base_L_Ring1': 'hand_L', 'CC_Base_L_Ring2': 'hand_L', 'CC_Base_L_Ring3': 'hand_L',
  'CC_Base_L_Pinky1': 'hand_L', 'CC_Base_L_Pinky2': 'hand_L', 'CC_Base_L_Pinky3': 'hand_L',
  'CC_Base_L_Thumb1': 'hand_L', 'CC_Base_L_Thumb2': 'hand_L', 'CC_Base_L_Thumb3': 'hand_L',
  'CC_Base_R_Hand': 'hand_R',
  'CC_Base_R_Index1': 'hand_R', 'CC_Base_R_Index2': 'hand_R', 'CC_Base_R_Index3': 'hand_R',
  'CC_Base_R_Mid1': 'hand_R', 'CC_Base_R_Mid2': 'hand_R', 'CC_Base_R_Mid3': 'hand_R',
  'CC_Base_R_Ring1': 'hand_R', 'CC_Base_R_Ring2': 'hand_R', 'CC_Base_R_Ring3': 'hand_R',
  'CC_Base_R_Pinky1': 'hand_R', 'CC_Base_R_Pinky2': 'hand_R', 'CC_Base_R_Pinky3': 'hand_R',
  'CC_Base_R_Thumb1': 'hand_R', 'CC_Base_R_Thumb2': 'hand_R', 'CC_Base_R_Thumb3': 'hand_R',

  // Legs
  'CC_Base_L_Thigh': 'thigh_L',
  'CC_Base_L_ThighTwist01': 'thigh_L', 'CC_Base_L_ThighTwist02': 'thigh_L',
  'CC_Base_L_KneeShareBone': 'thigh_L',
  'CC_Base_R_Thigh': 'thigh_R',
  'CC_Base_R_ThighTwist01': 'thigh_R', 'CC_Base_R_ThighTwist02': 'thigh_R',
  'CC_Base_R_KneeShareBone': 'thigh_R',
  'CC_Base_L_Calf': 'shin_L',
  'CC_Base_L_CalfTwist01': 'shin_L', 'CC_Base_L_CalfTwist02': 'shin_L',
  'CC_Base_R_Calf': 'shin_R',
  'CC_Base_R_CalfTwist01': 'shin_R', 'CC_Base_R_CalfTwist02': 'shin_R',
  'CC_Base_L_Foot': 'foot_L',
  'CC_Base_L_ToeBase': 'foot_L', 'CC_Base_L_ToeBaseShareBone': 'foot_L',
  'CC_Base_L_BigToe1': 'foot_L', 'CC_Base_L_IndexToe1': 'foot_L',
  'CC_Base_L_MidToe1': 'foot_L', 'CC_Base_L_RingToe1': 'foot_L', 'CC_Base_L_PinkyToe1': 'foot_L',
  'CC_Base_R_Foot': 'foot_R',
  'CC_Base_R_ToeBase': 'foot_R', 'CC_Base_R_ToeBaseShareBone': 'foot_R',
  'CC_Base_R_BigToe1': 'foot_R', 'CC_Base_R_IndexToe1': 'foot_R',
  'CC_Base_R_MidToe1': 'foot_R', 'CC_Base_R_RingToe1': 'foot_R', 'CC_Base_R_PinkyToe1': 'foot_R',
}

export function boneToZone(boneName: string, gender: BodyGender): BodyZoneId | null {
  const map = gender === 'male' ? MALE_MAP : FEMALE_MAP
  return map[boneName] ?? null
}
