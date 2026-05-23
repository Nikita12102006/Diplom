
export interface User {
  id: string;
  login: string;
  password?: string;
  fullName: string;
  specialty: string;
  dateOfBirth?: string;   
  education?: string;
  role: 'user' | 'admin';
}

export interface RegisterData {
  login: string;
  password: string;
  fullName: string;
  specialty: string;
  dateOfBirth?: string;
  education?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  specialty: string;
  timeLimit: number;
  questions: Question[];
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
}

export const SPECIALTIES = [
  { id: 'mechanic', name: 'Механик' },
  { id: 'diagnostician', name: 'Диагност' },
  { id: 'electrician', name: 'Электрик' },
  { id: 'order_receiver', name: 'Приёмщик заказов' },
];

export const EDUCATION_LEVELS = [
  { id: 'secondary', name: 'Среднее' },
  { id: 'secondary_vocational', name: 'Среднее профессиональное' },
  { id: 'higher', name: 'Высшее' },
  { id: 'other', name: 'Другое' },
];