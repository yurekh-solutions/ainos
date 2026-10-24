import SurveyForm, { emptySurvey } from '../survey-form';

export const metadata = { title: 'New survey' };

export default function NewSurveyPage() {
  return <SurveyForm mode="create" initial={emptySurvey} />;
}
