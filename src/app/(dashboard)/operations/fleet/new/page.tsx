'use client';

import VehicleForm, { emptyVehicle } from '../vehicle-form';

export default function NewVehiclePage() {
  return <VehicleForm mode="create" initial={emptyVehicle} />;
}
