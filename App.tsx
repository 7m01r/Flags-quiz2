
import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, Country, Question, GameState } from './types';
import { countries, getFlagUrl } from './data/countries';
import { getCountryFact } from './services/geminiService';
import { Globe, Trophy, Play, Settings, RefreshCcw, Info } from 'lucide-react';

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

  // Sound effects or visual feedback would go here

  const generateQuestions = (count: number, mode: GameMode) => {
    const shuffled = [...countries].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
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
        questionText = `أي من هذه الدول تمتلك أكبر مساحة؟`;
        const subset = [country, ...otherCountries.sort(() => 0.5 - Math.random()).slice(0, 3)];
        const sortedSubset = [...subset].sort((a, b) => b.area - a.area);
        targetValue = sortedSubset[0].name;
        options = subset.map(c => c.name).sort(() => 0.5 - Math.random());
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
      // Fetch fun fact only on correct answer to reward user
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

  if (!isPlaying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Globe className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">عالم الدول</h1>
          <p className="text-center text-gray-500 mb-8">اختبر معلوماتك الجغرافية بطريقة ممتعة</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع التحدي</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: GameMode.FLAGS, label: 'تخمين الأعلام', icon: '🏳️' },
                  { id: GameMode.CAPITALS, label: 'العواصم العالمية', icon: '🏛️' },
                  { id: GameMode.AREA, label: 'مقارنة المساحات', icon: '🌍' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setGameState(prev => ({ ...prev, mode: m.id as GameMode }))}
                    className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                      gameState.mode === m.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="text-2xl ml-3">{m.icon}</span>
                    <span className="font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأسئلة</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGameState(prev => ({ ...prev, totalQuestions: n }))}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      gameState.totalQuestions === n 
                        ? 'bg-blue-600 text-white' 
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
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              ابدأ التحدي
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.isFinished) {
    const percentage = (gameState.score / gameState.totalQuestions) * 100;
    let rank = "مبتدئ";
    if (percentage === 100) rank = "عبقري الجغرافيا";
    else if (percentage >= 80) rank = "خبير دولي";
    else if (percentage >= 50) rank = "مستكشف جيد";

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="mb-6 inline-block p-4 bg-yellow-100 rounded-full">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">انتهى التحدي!</h2>
          <p className="text-gray-500 mb-8">لقد قمت بعمل رائع</p>
          
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="text-5xl font-bold text-blue-600 mb-2">{gameState.score}/{gameState.totalQuestions}</div>
            <div className="text-xl font-semibold text-gray-700">{rank}</div>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 mb-4"
          >
            <RefreshCcw className="w-5 h-5" />
            تحدي جديد
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[gameState.currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            {gameState.currentQuestionIndex + 1}
          </div>
          <div className="text-sm font-medium text-gray-500">من أصل {gameState.totalQuestions}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-600">النقاط:</span>
          <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full font-bold">{gameState.score}</span>
        </div>
        <button onClick={resetGame} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-10 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">{currentQuestion.questionText}</h2>
        
        {currentQuestion.image && (
          <div className="mb-10 w-full max-w-sm rounded-xl overflow-hidden shadow-lg border-4 border-gray-50">
            <img src={currentQuestion.image} alt="Flag" className="w-full h-auto object-cover" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = option === currentQuestion.targetValue;
            const isSelected = option === selectedAnswer;
            
            let btnClass = "border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-700";
            if (isAnswered) {
              if (isCorrect) btnClass = "border-green-500 bg-green-50 text-green-700 scale-[1.02]";
              else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-700";
              else btnClass = "border-gray-50 text-gray-300 opacity-60";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleAnswer(option)}
                className={`py-5 px-6 rounded-2xl text-lg font-bold transition-all duration-300 transform active:scale-95 ${btnClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Gemini Fact Modal/Overlay */}
        {isAnswered && (
          <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedAnswer === currentQuestion.targetValue ? (
                <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-xl relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-800 mb-1">هل تعلم؟</h4>
                      {loadingFact ? (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        </div>
                      ) : (
                        <p className="text-blue-700 leading-relaxed">{fact}</p>
                      )}
                    </div>
                  </div>
                </div>
             ) : (
               <div className="bg-red-50 p-4 rounded-xl text-center">
                 <p className="text-red-600 font-medium">الإجابة الصحيحة هي: <span className="font-bold">{currentQuestion.targetValue}</span></p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-4 mb-8">
        {isAnswered && (
          <button
            onClick={nextQuestion}
            className="px-10 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-2xl font-bold shadow-lg transform transition-all active:scale-95 flex items-center gap-2"
          >
            {gameState.currentQuestionIndex + 1 === gameState.totalQuestions ? 'إنهاء المسابقة' : 'السؤال التالي'}
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
