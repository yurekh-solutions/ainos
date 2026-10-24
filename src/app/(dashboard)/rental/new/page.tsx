import RentalForm, { emptyRental } from '../rental-form';

export const metadata = { title: 'New rental order' };

export default function NewRentalOrderPage() {
  return <RentalForm mode="create" initial={emptyRental} />;
}
