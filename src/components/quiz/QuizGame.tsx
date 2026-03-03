
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import FallingHearts from '@/components/effects/FallingHearts';
import { Award, Heart } from 'lucide-react';

interface QuizQuestion {
  questionText: string;
  options: { text: string }[];
  correctAnswerIndex: number;
}

interface QuizGameProps {
  questions: QuizQuestion[];
}

export default function QuizGame({ questions }: QuizGameProps) {
  const { t } = useTranslation();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<{ score: number; total: number } | null>(null);

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const checkAnswers = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswerIndex) {
        score++;
      }
    });
    setResults({ score, total: questions.length });
  };

  const resetGame = () => {
    setSelectedAnswers({});
    setResults(null);
  };

  const allQuestionsAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 rounded-2xl relative overflow-hidden">
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 rounded-2xl text-center"
          >
            <div className="relative">
              <FallingHearts count={30} color="#D14D72" />
              <Award className="w-20 h-20 text-yellow-400 mb-4" />
            </div>
            <h2 className="text-3xl font-bold font-headline text-white mb-2">Quiz Concluído!</h2>
            <p className="text-2xl text-white font-bold mb-4">
              Você acertou <span className="text-green-400">{results.score}</span> de <span className="text-primary">{results.total}</span>!
            </p>
            {results.score === results.total && (
                 <p className="flex items-center gap-2 text-yellow-400 font-semibold"><Heart className="fill-current" /> Sincronia Perfeita!</p>
            )}
            <Button onClick={resetGame} className="mt-8">Jogar Novamente</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="p-6 bg-card/50 border border-border rounded-xl">
            <p className="font-bold text-lg text-foreground mb-4">{qIndex + 1}. {q.questionText}</p>
            <RadioGroup
              onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
              value={selectedAnswers[qIndex]?.toString()}
              className="space-y-2"
            >
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center space-x-3">
                  <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                  <Label htmlFor={`q${qIndex}-o${oIndex}`} className="text-base text-muted-foreground cursor-pointer">{opt.text}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button
          size="lg"
          onClick={checkAnswers}
          disabled={!allQuestionsAnswered}
        >
          Verificar Respostas
        </Button>
      </div>
    </div>
  );
}
