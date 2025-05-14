import {defineGenkit} from '@genkit-ai/next';
import '@/ai/dev'; // Ensure flows are imported for side effects

export const {GET, POST} = defineGenkit();

