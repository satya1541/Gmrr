import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Sparkles, Zap, Key, Plus, Eye, EyeOff } from 'lucide-react';
import chiplLogo from '@assets/chipl-logo.png';

interface PinProtectionProps {
  onSuccess: () => void;
  title?: string;
}

const LOCK_STORAGE_KEY = 'pin_lock_state';
const LOCK_DURATION = 30000; // 30 seconds

interface LockState {
  attempts: number;
  lockTimestamp: number | null;
}

function getLockState(): LockState {
  try {
    const stored = localStorage.getItem(LOCK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parse errors
  }
  return { attempts: 0, lockTimestamp: null };
}

function saveLockState(state: LockState): void {
  try {
    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore storage errors
  }
}

function clearLockState(): void {
  try {
    localStorage.removeItem(LOCK_STORAGE_KEY);
  } catch (e) {
    // Ignore storage errors
  }
}

export function PinProtection({ onSuccess, title = 'Admin Access' }: PinProtectionProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockTimestamp, setLockTimestamp] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Initialize state from localStorage on mount
  useEffect(() => {
    const stored = getLockState();
    
    if (stored.lockTimestamp) {
      const elapsed = Date.now() - stored.lockTimestamp;
      if (elapsed < LOCK_DURATION) {
        // Still locked
        setAttempts(stored.attempts);
        setLockTimestamp(stored.lockTimestamp);
        setRemainingTime(Math.ceil((LOCK_DURATION - elapsed) / 1000));
        setError('Too many failed attempts. Please wait.');
      } else {
        // Lock expired, clear state
        clearLockState();
        setAttempts(0);
        setLockTimestamp(null);
      }
    } else {
      setAttempts(stored.attempts);
    }
  }, []);

  // Countdown timer for lock
  useEffect(() => {
    if (lockTimestamp) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lockTimestamp;
        const remaining = Math.ceil((LOCK_DURATION - elapsed) / 1000);
        
        if (remaining <= 0) {
          // Lock expired
          clearLockState();
          setAttempts(0);
          setLockTimestamp(null);
          setRemainingTime(0);
          setError('');
          clearInterval(interval);
        } else {
          setRemainingTime(remaining);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lockTimestamp]);

  // Optimized PIN verification function with timeout
  const verifyPin = async (enteredPin: string): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: enteredPin }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.valid;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      
      return false;
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (isLocked || isVerifying) return;
    
    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    
    if (error) setError('');
    
    // Move to next input if digit entered
    if (digit && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
    
    // Auto-verify when all 4 digits are entered
    if (newPin.every(d => d !== '') && !isLocked) {
      setIsVerifying(true);
      const enteredPin = newPin.join('');
      
      // Add a small delay to show loading state and perform verification
      setTimeout(async () => {
        try {
          const isValid = await verifyPin(enteredPin);
          if (isValid) {
            setError('');
            setAttempts(0);
            setLockTimestamp(null);
            setRemainingTime(0);
            clearLockState(); // Clear any stored attempts on success
            onSuccess();
          } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setPin(['', '', '', '']);
            
            // Focus first input
            const firstInput = document.getElementById('pin-0');
            firstInput?.focus();
            
            // Lock for 30 seconds after 3 failed attempts
            if (newAttempts >= 3) {
              const now = Date.now();
              setLockTimestamp(now);
              setRemainingTime(30);
              setError('Too many failed attempts. Please wait.');
              saveLockState({ attempts: newAttempts, lockTimestamp: now });
            } else {
              setError('Invalid PIN. Please try again.');
              saveLockState({ attempts: newAttempts, lockTimestamp: null });
            }
          }
        } catch (error) {
          setError('Network error. Please check connection and try again.');
          setPin(['', '', '', '']);
          
          // Focus first input
          const firstInput = document.getElementById('pin-0');
          firstInput?.focus();
        } finally {
          setIsVerifying(false);
        }
      }, 100); // Reduced delay for faster response
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const isLocked = lockTimestamp !== null;



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 dark:from-blue-900 dark:via-blue-800 dark:to-purple-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-400/20 to-blue-400/20 dark:from-purple-500/10 dark:to-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-purple-300/10 dark:from-blue-400/5 dark:to-purple-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <Card className="w-full max-w-md bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200/50 dark:border-white/20 shadow-2xl shadow-blue-500/10 dark:shadow-black/20 relative overflow-hidden rounded-3xl">
        <div className="relative z-10">
          <CardHeader className="text-center space-y-8 pt-12 pb-8">
            {/* Logo with modern styling */}
            <div className="mx-auto relative">
              <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl relative overflow-hidden">
                <img 
                  src={chiplLogo} 
                  alt="CHIPL Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Lock className="h-6 w-6 text-gray-700 dark:text-white/80" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {title}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-white/70 text-base">Enter your 4-digit PIN to continue</p>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-12">
            {/* Single PIN Input Form with all elements contained */}
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
              {/* Hidden username field for accessibility */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                style={{ display: 'none' }}
                tabIndex={-1}
                aria-hidden="true"
              />
              
              <div className="flex justify-center gap-4">
                {pin.map((digit, index) => (
                  <div key={index} className="relative">
                    <Input
                      id={`pin-${index}`}
                      name={`pin-${index}`}
                      type={showPin ? "text" : "password"}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-14 h-14 text-center text-xl font-mono bg-gray-100 dark:bg-white/20 border-2 border-gray-300 dark:border-white/30 focus:border-blue-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-cyan-400/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 backdrop-blur-sm transition-all duration-300"
                      maxLength={1}
                      disabled={isLocked || isVerifying}
                      autoFocus={index === 0}
                      autoComplete="current-password"
                    />
                    {isVerifying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl">
                        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="flex justify-center">
                <div className="w-16 h-1 bg-gray-200 dark:bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-cyan-400 dark:to-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${(pin.filter(d => d !== '').length / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Show/Hide PIN Toggle inside form */}
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                  className="text-gray-600 hover:text-gray-800 dark:text-white/60 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPin ? "Hide" : "Show"}
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-400/30 rounded-xl p-4 text-center backdrop-blur-sm">
                  <p className="text-red-700 dark:text-red-200 font-medium flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-yellow-300/80 bg-amber-100 dark:bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm">
                    {isVerifying ? "Verifying PIN..." : "PIN will auto-verify when complete"}
                  </span>
                </div>
                
                {/* Status indicators */}
                {attempts > 0 && !isLocked && (
                  <div className="bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-300 dark:border-yellow-400/30 rounded-lg p-3 mt-4 backdrop-blur-sm">
                    <p className="text-yellow-700 dark:text-yellow-200 text-sm font-medium">
                      Failed attempts: {attempts}/3
                    </p>
                  </div>
                )}
                {isLocked && (
                  <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-400/30 rounded-lg p-3 mt-4 backdrop-blur-sm">
                    <p className="text-red-700 dark:text-red-200 text-sm font-medium">
                      Account locked. Wait {remainingTime} seconds to try again.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}