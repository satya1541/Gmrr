import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Sparkles, Zap, Key, Plus } from 'lucide-react';
import chiplLogo from '@assets/chipl-logo.png';

interface PinProtectionProps {
  onSuccess: () => void;
  title?: string;
}

export function PinProtection({ onSuccess, title = 'Admin Access' }: PinProtectionProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin PIN from database
  useEffect(() => {
    const fetchAdminPin = async () => {
      try {
        const response = await fetch('/api/admin/settings/admin_pin');
        if (response.ok) {
          const setting = await response.json();
          setAdminPin(setting.settingValue);
        } else {
          // Fallback to default PIN if not found
          setAdminPin('1541');
        }
      } catch (error) {
        // Always fallback to default PIN
        setAdminPin('1541');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminPin();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminPin) return;
    
    if (pin === adminPin) {
      setError('');
      onSuccess();
    } else {
      setError('Invalid PIN. Please try again.');
      setAttempts(prev => prev + 1);
      setPin('');
      
      // Lock for 30 seconds after 3 failed attempts
      if (attempts >= 2) {
        setError('Too many failed attempts. Please wait 30 seconds.');
        setTimeout(() => {
          setError('');
          setAttempts(0);
        }, 30000);
      }
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    if (error) setError('');
    
    // Auto-submit when 4 digits are entered
    if (value.length === 4 && !isLocked && adminPin) {
      setTimeout(() => {
        if (value === adminPin) {
          setError('');
          onSuccess();
        } else {
          setError('Invalid PIN. Please try again.');
          setAttempts(prev => prev + 1);
          setPin('');
          
          // Lock for 30 seconds after 3 failed attempts
          if (attempts >= 2) {
            setError('Too many failed attempts. Please wait 30 seconds.');
            setTimeout(() => {
              setError('');
              setAttempts(0);
            }, 30000);
          }
        }
      }, 300); // Small delay for better UX
    }
  };

  const isLocked = attempts >= 3;

  // Show loading state while fetching PIN
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-gray-200/50 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl shadow-teal-500/10 relative overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 p-[1px] rounded-lg">
          <div className="bg-white rounded-lg h-full w-full"></div>
        </div>
        
        <div className="relative z-10">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Enhanced CHIPL logo with animated background */}
            <div className="mx-auto relative">
              <div className="w-24 h-24 bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/25 relative overflow-hidden border-4 border-teal-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                {/* CHIPL Logo */}
                <img 
                  src={chiplLogo} 
                  alt="CHIPL Logo" 
                  className="w-16 h-16 object-contain relative z-10"
                />
                <Sparkles className="h-4 w-4 text-yellow-300 absolute top-2 right-2 animate-pulse" />
              </div>
              {/* Floating elements */}
              <Key className="h-3 w-3 text-teal-400 absolute -top-1 -left-1 animate-bounce delay-300" />
              <Zap className="h-3 w-3 text-emerald-400 absolute -bottom-1 -right-1 animate-bounce delay-700" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
                <Lock className="h-6 w-6 text-gray-700" />
                {title}
              </CardTitle>
              <p className="text-gray-600 text-lg">Enter your 4-digit PIN to continue</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse delay-200"></div>
                <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full animate-pulse delay-400"></div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="pin" className="text-base font-semibold text-gray-800 flex items-center justify-center gap-2">
                  <Key className="h-4 w-4 text-emerald-500" />
                  PIN Code
                </Label>
                
                {/* Enhanced PIN input with dot indicators */}
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={handlePinChange}
                      placeholder="••••"
                      className="text-center text-3xl tracking-[0.5em] font-mono h-16 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-inner transition-all duration-300"
                      maxLength={4}
                      disabled={isLocked}
                      autoFocus
                    />
                    {/* Visual PIN indicators */}
                    <div className="flex justify-center gap-3 mt-4">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-full transition-all duration-300 ${
                            index < pin.length
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg scale-110'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-red-600 font-medium flex items-center justify-center gap-2">
                        <Zap className="h-4 w-4" />
                        {error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center text-gray-600 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl">
                  <p className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Enter your 4-digit PIN - it will automatically verify
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={pin.length !== 4 || isLocked}
                  style={{ display: 'none' }}
                >
                  {isLocked ? 'Locked' : 'Access Admin Panel'}
                </Button>
                
                {/* Status indicators */}
                <div className="text-center space-y-2">
                  {attempts > 0 && !isLocked && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-700 text-sm font-medium">
                        Failed attempts: {attempts}/3
                      </p>
                    </div>
                  )}
                  {isLocked && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm font-medium">
                        Account locked. Wait 30 seconds to try again.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}