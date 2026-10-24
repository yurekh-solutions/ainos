'use client';

import RepairForm, { emptyRepair } from '../repair-form';

export default function NewRepairOrderPage() {
  return <RepairForm mode="create" initial={emptyRepair} />;
}
