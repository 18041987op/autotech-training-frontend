import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, Settings, LogOut, Search, Send, BookOpen, Clock, CheckCircle, AlertCircle, Lock, Unlock, TrendingUp, Database, MessageSquare, Award, ChevronDown, ChevronRight, X, Calendar, BarChart3 } from 'lucide-react';

// ⚠️ IMPORTANTE: Cambia esta URL por la de tu backend en Render
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function AutoRepairLearningPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedModule, setSelectedModule] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'technician' });

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  // Cargar módulos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadModules();
    }
  }, [isAuthenticated]);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('token');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.');
        setAuthView('login');
      } else {
        setError(data.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveSection('dashboard');
  };

  const loadModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/modules/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data.modules);
      }
    } catch (error) {
      console.error('Error cargando módulos:', error);
    }
  };

  const generateQuizWithAI = async (moduleTitle, moduleId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ module_title: moduleTitle, module_id: moduleId })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentQuiz(data.quiz);
        setQuizActive(true);
        setQuizAnswers({});
        setQuizSubmitted(false);
      } else {
        alert('Error al generar quiz. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al generar quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAIChatMessage = async (message) => {
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatInput('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          source: 'Base de Conocimiento'
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Lo siento, hubo un error. Intenta nuevamente.',
          error: true
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Verifica tu conexión a internet.',
        error: true
      }]);
    }
  };

  const submitQuiz = async () => {
    const quiz = currentQuiz;
    let correctCount = 0;

    quiz.questions.forEach((q, index) => {
      if (quizAnswers[index] === q.correct) {
        correctCount++;
      }
    });

    const score = (correctCount / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    setQuizSubmitted({ score, passed, correctCount, total: quiz.questions.length });

    // Guardar progreso en backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: selectedModule.id,
          completion_rate: passed ? 100 : 50,
          quiz_score: score
        })
      });
    } catch (error) {
      console.error('Error guardando progreso:', error);
    }
  };

  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl mx-auto flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Portal de Capacitación</h1>
            <p className="text-slate-600 mt-2">Sistema de Certificación Profesional</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {authView === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('register');
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ¿No tienes cuenta? Registrarse
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Tu cuenta será revisada por un administrador antes de obtener acceso.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rol
                </label>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="technician">Técnico Automotriz</option>
                  <option value="administrative">Personal Administrativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Solicitar Acceso'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ¿Ya tienes cuenta? Iniciar Sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  const DashboardView = () => {
    const groupedModules = modules.reduce((acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Módulos de Capacitación</h2>

        {Object.keys(groupedModules).map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
              {category === 'universal' ? 'Módulos Universales' :
               category === 'technician' ? 'Módulos Técnicos' :
               'Módulos Administrativos'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedModules[category].map(module => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ModuleCard = ({ module }) => {
    const canAccess = module.category === 'universal' ||
                     module.category === currentUser?.role ||
                     currentUser?.role === 'admin';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
        <div className="h-1" style={{ backgroundColor: module.color }}></div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${module.color}15` }}>
              <Shield className="w-5 h-5" style={{ color: module.color }} />
            </div>
            {module.required && (
              <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
                Obligatorio
              </span>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 mb-1">{module.title}</h3>
          <p className="text-sm text-slate-600 mb-4">{module.description}</p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Completado</span>
              <span className="font-medium">{module.completionRate || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${module.completionRate || 0}%`,
                  backgroundColor: module.color
                }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => {
              if (canAccess) {
                setSelectedModule(module);
                setActiveSection('module');
              }
            }}
            disabled={!canAccess}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              canAccess
                ? 'text-white hover:opacity-90'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            style={canAccess ? { backgroundColor: module.color } : {}}
          >
            {canAccess ? 'Acceder al Módulo' : 'Acceso Restringido'}
          </button>
        </div>
      </div>
    );
  };

  const ModuleDetailView = () => {
    if (!selectedModule) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedModule(null);
            setActiveSection('dashboard');
          }}
          className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2"
        >
          ← Volver al Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{selectedModule.title}</h1>
          <p className="text-slate-600 mb-6">{selectedModule.description}</p>

          <button
            onClick={() => generateQuizWithAI(selectedModule.title, selectedModule.id)}
            disabled={loading}
            className="w-full py-4 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-3"
            style={{ backgroundColor: selectedModule.color }}
          >
            <BookOpen className="w-5 h-5" />
            {loading ? 'Generando evaluación...' : 'Iniciar Evaluación de Certificación'}
          </button>
        </div>
      </div>
    );
  };

  const QuizView = () => {
    if (!currentQuiz) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {!quizSubmitted ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-900">{currentQuiz.title}</h2>
              
              {currentQuiz.questions.map((question, qIndex) => (
                <div key={question.id} className="pb-8 border-b border-slate-200 last:border-0">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {qIndex + 1}. {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          quizAnswers[qIndex] === oIndex
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [qIndex]: oIndex })}
                          className="mt-1"
                        />
                        <span className="text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length !== currentQuiz.questions.length}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Enviar Evaluación
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`p-8 rounded-xl ${quizSubmitted.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                <div className="text-center">
                  {quizSubmitted.passed ? (
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  )}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {quizSubmitted.passed ? '¡Felicitaciones!' : 'Resultado Insuficiente'}
                  </h3>
                  <p className="text-4xl font-bold text-slate-900 mb-2">{quizSubmitted.score.toFixed(0)}%</p>
                  <p className="text-slate-600">
                    {quizSubmitted.correctCount}/{quizSubmitted.total} respuestas correctas
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setQuizActive(false);
                  setCurrentQuiz(null);
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">AutoTech Training</h1>
                <p className="text-xs text-slate-500">Sistema de Certificación Profesional</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all relative"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {currentUser?.name?.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-slate-900">{currentUser?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {quizActive ? (
          <QuizView />
        ) : activeSection === 'module' ? (
          <ModuleDetailView />
        ) : (
          <DashboardView />
        )}
      </main>

      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white">Asistente de Capacitación</h3>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-8">
                <p className="mb-2">Hola, soy tu asistente de capacitación.</p>
                <p>Pregúntame sobre procedimientos, políticas o regulaciones.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.error
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    handleAIChatMessage(chatInput);
                  }
                }}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => {
                  if (chatInput.trim()) {
                    handleAIChatMessage(chatInput);
                  }
                }}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
