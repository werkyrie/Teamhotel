"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeProvider } from "@/components/theme-provider"
import { Fingerprint, Mail, ArrowRight, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import "particles.js"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { login, isAuthenticated, loginError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeout = searchParams.get("timeout")
  const [rememberMe, setRememberMe] = useState(false)

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Set error message if login error exists
  useEffect(() => {
    if (loginError) {
      setErrorMessage(loginError)
    }
  }, [loginError])

  // Set timeout message
  useEffect(() => {
    if (timeout) {
      setErrorMessage("Your session has expired. Please log in again.")
    }
  }, [timeout])

  // Initialize particles.js
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const loadParticles = async () => {
        try {
          // @ts-ignore
          if (!window.particlesJS) {
            const particlesJS = await import("particles.js")
            // Initialize particles
            // @ts-ignore
            window.particlesJS("particles-js", {
              particles: {
                number: { value: 100, density: { enable: true, value_area: 1000 } },
                color: { value: "#808080" },
                shape: {
                  type: "circle",
                  stroke: { width: 0, color: "#000000" },
                  polygon: { nb_sides: 5 },
                },
                opacity: {
                  value: 0.2,
                  random: true,
                  anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false },
                },
                size: {
                  value: 3,
                  random: true,
                  anim: { enable: true, speed: 2, size_min: 0.1, sync: false },
                },
                line_linked: {
                  enable: true,
                  distance: 150,
                  color: "#808080",
                  opacity: 0.15,
                  width: 1,
                },
                move: {
                  enable: true,
                  speed: 1,
                  direction: "none",
                  random: true,
                  straight: false,
                  out_mode: "out",
                  bounce: false,
                  attract: { enable: false, rotateX: 600, rotateY: 1200 },
                },
              },
              interactivity: {
                detect_on: "canvas",
                events: {
                  onhover: { enable: true, mode: "grab" },
                  onclick: { enable: true, mode: "push" },
                  resize: true,
                },
                modes: {
                  grab: { distance: 140, line_linked: { opacity: 0.4 } },
                  bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
                  repulse: { distance: 200, duration: 0.4 },
                  push: { particles_nb: 4 },
                  remove: { particles_nb: 2 },
                },
              },
              retina_detect: true,
            })
          }
        } catch (error) {
          console.error("Failed to load particles.js", error)
        }
      }

      loadParticles()

      // Add mouse move effect for the card
      const card = document.querySelector(".login-card")
      if (card) {
        document.addEventListener("mousemove", (e) => {
          const x = e.clientX / window.innerWidth
          const y = e.clientY / window.innerHeight

          // Subtle rotation effect
          card.style.transform = `perspective(1000px) rotateY(${(x - 0.5) * 5}deg) rotateX(${(y - 0.5) * -5}deg)`
        })
      }

      return () => {
        document.removeEventListener("mousemove", () => {})
      }
    }
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await login(email, password, rememberMe)
      if (!result.success) {
        setErrorMessage(result.message)
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.6,
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4">
        {/* Theme toggle button */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMounted(true)
              const theme = document.documentElement.classList.contains("dark") ? "light" : "dark"
              if (theme === "light") {
                document.documentElement.classList.remove("dark")
                localStorage.setItem("theme", "light")
              } else {
                document.documentElement.classList.add("dark")
                localStorage.setItem("theme", "dark")
              }
            }}
            className="rounded-full bg-white/10 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white/20 dark:hover:bg-gray-800/30"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-700" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-300" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        {/* Background gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 z-0">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.02)_1px,_transparent_1px)] bg-[length:24px_24px] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)]" />
          <div className="absolute inset-0 backdrop-blur-[100px]" />

          {/* Animated background blobs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gray-200/50 dark:bg-gray-700/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gray-300/50 dark:bg-gray-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-gray-100/50 dark:bg-gray-800/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
          <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-gray-400/50 dark:bg-gray-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-3000" />
        </div>

        {/* Interactive particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div id="particles-js" className="absolute inset-0"></div>
        </div>

        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-md z-10"
          >
            <Card className="login-card backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-300/30 dark:shadow-black/30 rounded-2xl transition-transform duration-300 ease-out animate-float">
              <CardHeader className="space-y-1 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                    delay: 0.5,
                  }}
                  className="flex justify-center mb-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center shadow-lg">
                    <Fingerprint className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert className="mb-6 bg-red-500/20 backdrop-blur-md text-white border-red-500/30">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 focus:ring-gray-400/30 dark:focus:border-gray-600 dark:focus:ring-gray-600/30"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div className="space-y-2" variants={itemVariants}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        type="button"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative group">
                      <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 focus:ring-gray-400/30 dark:focus:border-gray-600 dark:focus:ring-gray-600/30"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div className="flex items-center space-x-2" variants={itemVariants}>
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="data-[state=checked]:bg-gray-800 data-[state=checked]:dark:bg-gray-200"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Remember me for 5 days
                    </label>
                  </motion.div>

                  <motion.div variants={buttonVariants} whileHover="hover">
                    <Button
                      type="submit"
                      className="w-full py-6 text-base font-medium bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 hover:text-white dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 dark:hover:from-gray-200 dark:hover:via-gray-100 dark:hover:to-white dark:hover:text-gray-900 transition-all duration-300 rounded-xl shadow-lg group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Authenticating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </CardContent>

              <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700/50 p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Need help? Contact your system administrator</p>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-sm text-gray-500 dark:text-gray-400 z-10"
          >
            © {new Date().getFullYear()} Client Management System. All rights reserved.
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0V20M0 1H20' stroke='white' strokeOpacity='0.1'/%3E%3C/svg%3E%0A");
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </ThemeProvider>
  )
}
