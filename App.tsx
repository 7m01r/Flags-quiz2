
import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, Country, Question, GameState } from './types';
import { countries, getFlagUrl } from './data/countries';
import { getCountryFact } from './services/geminiService';
import { Globe, Trophy, Play, Settings, RefreshCcw, Info, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    currentQuestionIndex: 0,
    totalQuestions: 10,
    isFinished: false,
    mode: GameMode.FLAGS,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [fact, setFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);

  const generateQuestions = (count: number, mode: GameMode) => {
    const shuffled = [...countries].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    return selected.map((country, index) => {
      let options: (string | number)[] = [];
      let questionText = "";
      let targetValue: string | number = "";
      let image: string | undefined = undefined;

      const otherCountries = countries.filter(c => c.name !== country.name);

      if (mode === GameMode.FLAGS) {
        questionText = "ما هي الدولة التي يمثلها هذا العلم؟";
        targetValue = country.name;
        image = getFlagUrl(country.code);
        const distractors = otherCountries.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.name);
        options = [country.name, ...distractors].sort(() => 0.5 - Math.random());
      } else if (mode === GameMode.CAPITALS) {
        questionText = `ما هي عاصمة ${country.name}؟`;
        targetValue = country.capital;
        const distractors = otherCountries.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.capital);
        options = [country.capital, ...distractors].sort(() => 0.5 - Math.random());
      } else if (mode === GameMode.AREA) {
        // Find 3 other random countries to compare
        const pool = [country, ...otherCountries.sort(() => 0.5 - Math.random()).slice(0, 3)];
        const largest = [...pool].sort((a, b) => b.area - a.area)[0];
        questionText = `أي من هذه الدول تمتلك أكبر مساحة سطحية؟`;
        targetValue = largest.name;
        options = pool.map(c => c.name).sort(() => 0.5 - Math.random());
      }

      return {
        id: index,
        type: mode,
        questionText,
        targetValue,
        options,
        country,
        image
      };
    });
  };

  const startNewGame = (count: number, mode: GameMode) => {
    const newQuestions = generateQuestions(count, mode);
    setQuestions(newQuestions);
    setGameState({
      score: 0,
      currentQuestionIndex: 0,
      totalQuestions: count,
      isFinished: false,
      mode: mode,
    });
    setIsPlaying(true);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setFact(null);
  };

  const handleAnswer = async (answer: string | number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const currentQ = questions[gameState.currentQuestionIndex];
    const isCorrect = answer === currentQ.targetValue;

    if (isCorrect) {
      setGameState(prev => ({ ...prev, score: prev.score + 1 }));
      setLoadingFact(true);
      const newFact = await getCountryFact(currentQ.country.name);
      setFact(newFact);
      setLoadingFact(false);
    }
  };

  const nextQuestion = () => {
    if (gameState.currentQuestionIndex + 1 < gameState.totalQuestions) {
      setGameState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
      setIsAnswered(false);
      setSelectedAnswer(null);
      setFact(null);
    } else {
      setGameState(prev => ({ ...prev, isFinished: true }));
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState(prev => ({ ...prev, isFinished: false, currentQuestionIndex: 0, score: 0 }));
  };

  // --- شاشة البداية ---
  if (!isPlaying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-6 md:p-10 w-full max-w-lg border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl shadow-lg shadow-blue-200">
              <Globe className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-center text-gray-800 mb-2">عالم الدول</h1>
          <p className="text-center text-gray-500 mb-8 font-medium">مغامرة جغرافية ذكية بين يديك</p>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 mr-2">اختر نوع التحدي</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: GameMode.FLAGS, label: 'أعلام الدول', icon: '🏳️' },
                  { id: GameMode.CAPITALS, label: 'العواصم العالمية', icon: '🏛️' },
                  { id: GameMode.AREA, label: 'تحدي المساحات', icon: '🌍' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setGameState(prev => ({ ...prev, mode: m.id as GameMode }))}
                    className={`flex items-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                      gameState.mode === m.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                        : 'border-gray-50 hover:border-blue-100 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="text-2xl ml-4">{m.icon}</span>
                    <span className="font-bold text-lg">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 mr-2">عدد الأسئلة</label>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGameState(prev => ({ ...prev, totalQuestions: n }))}
                    className={`flex-1 min-w-[60px] py-3 rounded-xl font-bold transition-all ${
                      gameState.totalQuestions === n 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => startNewGame(gameState.totalQuestions, gameState.mode)}
              className="w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-green-100 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
            >
              <Play className="w-6 h-6 fill-current" />
              ابدأ الآن
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- شاشة النهاية ---
  if (gameState.isFinished) {
    const percentage = (gameState.score / gameState.totalQuestions) * 100;
    let rank = "مبتدئ";
    let color = "text-gray-600";
    if (percentage === 100) { rank = "أسطورة الجغرافيا"; color = "text-yellow-600"; }
    else if (percentage >= 80) { rank = "خبير دولي"; color = "text-blue-600"; }
    else if (percentage >= 50) { rank = "مستكشف ذكي"; color = "text-emerald-600"; }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 w-full max-w-md text-center border border-gray-100">
          <div className="mb-6 inline-block p-6 bg-yellow-50 rounded-full animate-bounce">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">رائع جداً!</h2>
          <p className="text-gray-500 mb-8 font-medium">أنهيت التحدي بنجاح</p>
          
          <div className="bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100">
            <div className="text-6xl font-black text-blue-600 mb-3">{gameState.score} <span className="text-2xl text-gray-400 font-normal">/ {gameState.totalQuestions}</span></div>
            <div className={`text-2xl font-black ${color}`}>{rank}</div>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <RefreshCcw className="w-6 h-6" />
            تحدي جديد
          </button>
        </div>
      </div>
    );
  }

  // --- شاشة الأسئلة ---
  const currentQuestion = questions[gameState.currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 min-h-screen flex flex-col">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 bg-white/70 backdrop-blur-lg p-4 md:p-5 rounded-[1.5rem] shadow-sm border border-white/50">
        <div className="flex items-center gap-3">
          <button onClick={resetGame} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
             <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">السؤال</span>
             <span className="text-lg md:text-xl font-black text-gray-800 leading-none">
               {gameState.currentQuestionIndex + 1} <span className="text-sm font-normal text-gray-400">/ {gameState.totalQuestions}</span>
             </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">النقاط</span>
           <span className="text-lg md:text-xl font-black text-emerald-600 leading-none tracking-tighter">{gameState.score}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-gray-200/50 rounded-full mb-8 overflow-hidden backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700 ease-out"
          style={{ width: `${((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-xl p-6 md:p-10 mb-6 flex-1 flex flex-col items-center justify-center border border-white">
        <h2 className="text-xl md:text-3xl font-black text-gray-800 mb-8 text-center px-2 leading-tight">
          {currentQuestion.questionText}
        </h2>
        
        {currentQuestion.image && (
          <div className="mb-10 w-full max-w-xs md:max-w-sm rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-100/50 border-8 border-white group transition-transform hover:scale-[1.02]">
            <img 
              src={currentQuestion.image} 
              alt="Flag" 
              className="w-full aspect-[3/2] object-cover" 
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = option === currentQuestion.targetValue;
            const isSelected = option === selectedAnswer;
            
            let btnClass = "border-2 border-gray-100 bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-50";
            if (isAnswered) {
              if (isCorrect) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md scale-[1.02] ring-4 ring-emerald-50";
              else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-700 ring-4 ring-red-50";
              else btnClass = "border-gray-50 text-gray-300 opacity-60";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleAnswer(option)}
                className={`py-4 md:py-6 px-6 rounded-[1.5rem] text-base md:text-xl font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center text-center ${btnClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Gemini Fact */}
        {isAnswered && (
          <div className="mt-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
             {selectedAnswer === currentQuestion.targetValue ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-r-8 border-blue-500 p-6 md:p-8 rounded-[2rem] shadow-inner">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-500 rounded-full">
                       <Info className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-blue-900 mb-2 text-lg">هل تعلم؟</h4>
                      {loadingFact ? (
                        <div className="flex gap-2 py-2">
                          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />
                          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]" />
                          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]" />
                        </div>
                      ) : (
                        <p className="text-blue-800 leading-relaxed font-medium text-base md:text-lg italic opacity-90">
                          {fact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
             ) : (
               <div className="bg-red-50 p-5 rounded-[1.5rem] text-center border border-red-100">
                 <p className="text-red-600 font-bold text-lg">
                   للأسف! الإجابة الصحيحة هي: <span className="underline decoration-2 underline-offset-4">{currentQuestion.targetValue}</span>
                 </p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-center md:justify-end mt-4 pb-10">
        {isAnswered && (
          <button
            onClick={nextQuestion}
            className="w-full md:w-auto px-12 py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-lg md:text-xl shadow-2xl shadow-gray-200 transform transition-all active:scale-95 flex items-center justify-center gap-3 animate-in zoom-in duration-300"
          >
            {gameState.currentQuestionIndex + 1 === gameState.totalQuestions ? 'إنهاء المسابقة' : 'السؤال التالي'}
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
