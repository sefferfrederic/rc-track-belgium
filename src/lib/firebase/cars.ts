import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./client";
import type { Car, CarSetup } from "@/types";

// --- Voitures ---

export interface CarInput {
  name: string;
  disciplineId: string | null;
  scaleId: string | null;
  photoURL: string | null;
}

export async function fetchMyCars(uid: string): Promise<Car[]> {
  const q = query(collection(db, "cars"), where("ownerUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Car)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchCar(carId: string): Promise<Car | null> {
  const snap = await getDoc(doc(db, "cars", carId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Car) : null;
}

export async function createCar(input: CarInput, ownerUid: string, ownerName: string): Promise<string> {
  const ref = await addDoc(collection(db, "cars"), {
    ...input,
    ownerUid,
    ownerName,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateCar(carId: string, input: CarInput): Promise<void> {
  await updateDoc(doc(db, "cars", carId), { ...input });
}

export async function deleteCar(carId: string): Promise<void> {
  // Supprime aussi toutes les fiches de réglages de cette voiture
  const setupsSnap = await getDocs(collection(db, "cars", carId, "setups"));
  await Promise.all(setupsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "cars", carId));
}

// --- Fiches de réglages ---

export interface SetupInput {
  trackId: string | null;
  date: string;
  weather: CarSetup["weather"];
  surfaceId: string | null;
  gripLevel: CarSetup["gripLevel"];
  rideHeightFront: number | null;
  rideHeightRear: number | null;
  diffOilFront: string | null;
  diffOilCenter: string | null;
  diffOilRear: string | null;
  shockOilFront: string | null;
  shockOilRear: string | null;
  notes: string;
  isPublic: boolean;
}

export async function fetchSetupsForCar(carId: string): Promise<CarSetup[]> {
  const q = query(collection(db, "cars", carId, "setups"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CarSetup);
}

export async function createSetup(
  carId: string,
  carName: string,
  input: SetupInput,
  authorUid: string,
  authorName: string
): Promise<void> {
  await addDoc(collection(db, "cars", carId, "setups"), {
    ...input,
    carId,
    carName,
    authorUid,
    authorName,
    createdAt: Date.now(),
  });
}

export async function updateSetup(carId: string, setupId: string, input: SetupInput): Promise<void> {
  await updateDoc(doc(db, "cars", carId, "setups", setupId), { ...input });
}

export async function deleteSetup(carId: string, setupId: string): Promise<void> {
  await deleteDoc(doc(db, "cars", carId, "setups", setupId));
}
