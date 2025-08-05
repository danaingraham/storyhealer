import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, BookOpen, Sparkles, Camera, Shield, Heart, Stars } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="font-fredoka text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Help Your Child <span className="text-gradient">Conquer Their Fears</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Create personalized AI-powered storybooks where your child becomes the brave hero of their own adventure
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/story/create" className="btn-primary inline-flex items-center">
                Create Your Story
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/sample" className="btn-secondary inline-flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                View Sample Story
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <h2 className="font-fredoka text-4xl md:text-5xl font-bold text-center mb-16">
              How It <span className="text-gradient">Works</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center card-hover p-8 rounded-2xl bg-white shadow-lg">
                <div className="w-20 h-20 mx-auto mb-6 bg-pink-100 rounded-full flex items-center justify-center">
                  <Camera className="h-10 w-10 text-pink-500" />
                </div>
                <h3 className="font-fredoka text-2xl font-semibold mb-4">Create Character</h3>
                <p className="text-gray-600">
                  Upload a photo or describe your child to create their personalized hero character
                </p>
              </div>
              <div className="text-center card-hover p-8 rounded-2xl bg-white shadow-lg">
                <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="font-fredoka text-2xl font-semibold mb-4">Share Their Fear</h3>
                <p className="text-gray-600">
                  Tell us what your child is afraid of - darkness, swimming, school, or anything else
                </p>
              </div>
              <div className="text-center card-hover p-8 rounded-2xl bg-white shadow-lg">
                <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-indigo-500" />
                </div>
                <h3 className="font-fredoka text-2xl font-semibold mb-4">Magic Happens</h3>
                <p className="text-gray-600">
                  Our AI creates a beautiful 6-page illustrated story with your child as the brave hero
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-fredoka text-4xl md:text-5xl font-bold text-center mb-16">
              Why Parents <span className="text-gradient">Love StoryHealer</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="glassmorphism p-6 rounded-xl">
                <Heart className="h-8 w-8 text-pink-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Personalized Stories</h3>
                <p className="text-gray-600 text-sm">
                  Every story is unique to your child's appearance and specific fears
                </p>
              </div>
              <div className="glassmorphism p-6 rounded-xl">
                <Camera className="h-8 w-8 text-purple-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Photo-Based Characters</h3>
                <p className="text-gray-600 text-sm">
                  Upload a photo and watch your child come to life in the illustrations
                </p>
              </div>
              <div className="glassmorphism p-6 rounded-xl">
                <BookOpen className="h-8 w-8 text-indigo-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">6-Page Adventures</h3>
                <p className="text-gray-600 text-sm">
                  Perfect length for bedtime stories that build confidence
                </p>
              </div>
              <div className="glassmorphism p-6 rounded-xl">
                <Stars className="h-8 w-8 text-pink-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">AI-Illustrated</h3>
                <p className="text-gray-600 text-sm">
                  Beautiful, child-friendly illustrations that bring the story to life
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-fredoka text-4xl md:text-5xl font-bold mb-6">
              Ready to Help Your Child Be Brave?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of parents who are helping their children overcome fears through the power of personalized storytelling
            </p>
            <Link href="/story/create" className="btn-secondary inline-flex items-center text-lg">
              Start Creating Now
              <Sparkles className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}