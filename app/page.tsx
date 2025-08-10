import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Rocket, Code2, Sparkles } from "lucide-react";
import Link from "next/link";

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
        <div className="mt-8">
          <Link href="/scout">
            <Button size="lg">Go to Scout →</Button>
          </Link>
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
      </div>
    </div>
  );
}
