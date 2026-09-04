import {
  Code2,
  Palette,
  Braces,
  Layers,
  Server,
  Database,
  BarChart3,
  Cpu,
  GitBranch,
  Shield,
  Boxes,
  Terminal,
  Wrench,
  ArrowRight,
} from "lucide-react";

type Icon = (props: { className?: string }) => React.ReactNode;

const MAP: Record<string, Icon> = {
  js: ({ className }) => <Braces className={className} />,
  html: ({ className }) => <Code2 className={className} />,
  css: ({ className }) => <Palette className={className} />,
  ui: ({ className }) => <Layers className={className} />,
  react: ({ className }) => <Code2 className={className} />,
  node: ({ className }) => <Server className={className} />,
  sql: ({ className }) => <Database className={className} />,
  python: ({ className }) => <Terminal className={className} />,
  pandas: ({ className }) => <BarChart3 className={className} />,
  numpy: ({ className }) => <Cpu className={className} />,
  matplotlib: ({ className }) => <BarChart3 className={className} />,
  seaborn: ({ className }) => <BarChart3 className={className} />,
  sklearn: ({ className }) => <Cpu className={className} />,
  ml: ({ className }) => <Cpu className={className} />,
  llms: ({ className }) => <Boxes className={className} />,
  rag: ({ className }) => <Database className={className} />,
  agentic: ({ className }) => <Boxes className={className} />,
  genai: ({ className }) => <Boxes className={className} />,
  bi: ({ className }) => <BarChart3 className={className} />,
  excel: ({ className }) => <BarChart3 className={className} />,
  three: ({ className }) => <Layers className={className} />,
  git: ({ className }) => <GitBranch className={className} />,
  api: ({ className }) => <ArrowRight className={className} />,
  devops: ({ className }) => <Wrench className={className} />,
  rn: ({ className }) => <Code2 className={className} />,
  flutter: ({ className }) => <Layers className={className} />,
  sec: ({ className }) => <Shield className={className} />,
  sysdes: ({ className }) => <Boxes className={className} />,
};

const FALLBACK: Icon = ({ className }) => <Code2 className={className} />;

export function byIcon(name?: string | null): Icon {
  return (name && MAP[name.toLowerCase()]) || FALLBACK;
}
