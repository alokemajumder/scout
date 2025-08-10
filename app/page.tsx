import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Rocket, Code2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Scout</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui components.
          Built for performance, scalability, and developer experience.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <Badge variant="secondary">Next.js 14</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Tailwind CSS</Badge>
          <Badge variant="secondary">shadcn/ui</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Modern Stack
            </CardTitle>
            <CardDescription>
              Built with the latest web technologies and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Leveraging Next.js 14 App Router, TypeScript for type safety, 
              and Tailwind CSS for utility-first styling.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Component Library
            </CardTitle>
            <CardDescription>
              Pre-built components with shadcn/ui integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Beautiful, accessible components built on Radix UI primitives 
              with customizable themes and animations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Ready to Deploy
            </CardTitle>
            <CardDescription>
              Production-ready configuration and optimizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configured with ESLint, optimized builds, and deployment-ready 
              settings for modern hosting platforms.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <Tabs defaultValue="overview" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                This is a starter template for building modern web applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This Scout application provides a solid foundation for building scalable web applications with:</p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Next.js 14 with App Router for modern React development</li>
                <li>TypeScript for enhanced developer experience and type safety</li>
                <li>Tailwind CSS for rapid UI development</li>
                <li>shadcn/ui for beautiful, accessible component library</li>
                <li>Lucide React for consistent iconography</li>
                <li>Framer Motion for smooth animations (ready to use)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
              <CardDescription>
                What makes this template special
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium mb-2">🚀 Performance First</h4>
                  <p className="text-sm text-muted-foreground">Optimized builds, code splitting, and modern bundling</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🎨 Design System</h4>
                  <p className="text-sm text-muted-foreground">Consistent theming with light/dark mode support</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">♿ Accessibility</h4>
                  <p className="text-sm text-muted-foreground">Built-in accessibility features and ARIA compliance</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📱 Responsive</h4>
                  <p className="text-sm text-muted-foreground">Mobile-first design that works on all devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Quick setup instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Development Setup:</h4>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>npm install</div>
                  <div>npm run dev</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Environment Variables:</h4>
                <p className="text-sm text-muted-foreground">
                  Configure TIME_ZONE to Asia/Kolkata for proper time formatting.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">shadcn/ui Components:</h4>
                <p className="text-sm text-muted-foreground">
                  Add new components with: npx shadcn@latest add [component]
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center mt-12">
        <Button size="lg" className="mr-4">
          Get Started
        </Button>
        <Button variant="outline" size="lg">
          View Documentation
        </Button>
      </div>
    </div>
  );
}
