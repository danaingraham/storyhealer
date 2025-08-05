import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © 2024 StoryHealer. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/sample" className="text-gray-600 hover:text-gray-900">
              Sample Story
            </Link>
          </div>
          
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-600 flex items-center">
              Made with <Heart className="h-4 w-4 mx-1 text-pink-500 fill-current" /> for kids everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}