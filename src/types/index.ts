export interface User {
  id: string;
  login: string;
  password: string;
  fullName: string;
  specialty: string;
  role: 'user' | 'admin';
  age?: number;
  education?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  specialty: string;
  questions: Question[];
  timeLimit: number;
  createdAt: string;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  userName: string;
  specialty: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  timeSpent: number;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
}

export const SPECIALTIES: Specialty[] = [
  { id: 'mechanic', name: 'Автослесарь', description: 'Техническое обслуживание и ремонт автомобилей' },
  { id: 'diagnostician', name: 'Диагност', description: 'Компьютерная диагностика автомобилей' },
  { id: 'electrician', name: 'Автоэлектрик', description: 'Ремонт электрооборудования автомобилей' },
  { id: 'order_receiver', name: 'Приемщик заказов на ремонт', description: 'Прием и оформление заказов на ремонт' },
];

export const EDUCATION_LEVELS = [
  { id: 'secondary', name: 'Среднее общее' },
  { id: 'secondary_vocational', name: 'Среднее профессиональное' },
  { id: 'incomplete_higher', name: 'Неполное высшее' },
  { id: 'higher', name: 'Высшее' },
  { id: 'two_or_more_higher', name: 'Два и более высших' },
];