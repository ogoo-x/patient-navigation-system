import type { ImageSourcePropType } from "react-native";

const placeImages: Record<string, ImageSourcePropType> = {
  ae: require("../../assets/places/Accident and Emergency.png"),
  "mother-child-antenatal": require("../../assets/places/Antenatal Care Clinic.png"),
  "mother-child": require("../../assets/places/Prince Arthur Eze Mother and Child COmplex 1.png"),
  gopd: require("../../assets/places/General Out-Patient Department 1.png"),
  "ibeto-ict": require("../../assets/places/ICT Centre.png"),
  "main-gate": require("../../assets/places/Main Gate.png"),
  "ae-medical": require("../../assets/places/Medical Emergency 1.png"),
  "paediatric-emergency": require("../../assets/places/Paediatric Emergency.png"),
  mopc: require("../../assets/places/Medical Out Patient Clinic 1.png"),
  "medical-ward-complex": require("../../assets/places/Medical Ward 1.png"),
  sopd: require("../../assets/places/Surgical Out Patient Department 1.png"),
  "surgical-complex": require("../../assets/places/Surgical Ward 1.png"),
};

export function getPlaceImage(
  placeId: string,
): ImageSourcePropType | undefined {
  return placeImages[placeId];
}
