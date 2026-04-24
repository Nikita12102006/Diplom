export interface User {
  id: string;
  login: string;
  password: string;
  fullName: string;
  specialty: string;
  role: 'user' | 'admin';
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
  timeLimit: number; // в минутах
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
  timeSpent: number; // в секундах
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
}

export const SPECIALTIES: Specialty[] = [
  { id: 'mechanic', name: 'Автомеханик', description: 'Диагностика и ремонт автомобилей' },
  { id: 'electrician', name: 'Автоэлектрик', description: 'Ремонт электрооборудования автомобилей' },
  { id: 'painter', name: 'Автомаляр', description: 'Покраска и кузовной ремонт' },
  { id: 'diagnostician', name: 'Диагност', description: 'Компьютерная диагностика автомобилей' },
  { id: 'tire_fitter', name: 'Шиномонтажник', description: 'Шиномонтаж и балансировка' },
];
