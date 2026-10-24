import ApprovalForm, { emptyApproval } from '../approval-form';

export const metadata = { title: 'New approval request' };

export default function NewApprovalPage() {
  return <ApprovalForm mode="create" initial={emptyApproval} />;
}
