import { 
  LayoutDashboard, 
  Users, 
  Dog, 
  Calendar, 
  Stethoscope, 
  Syringe, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  BarChart3, 
  Settings 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import huskyIcon from "@/assets/husky-icon.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Pets", url: "/pets", icon: Dog },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Atendimentos", url: "/atendimentos", icon: Stethoscope },
  { title: "Vacinas", url: "/vacinas", icon: Syringe },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "PDV", url: "/pdv", icon: ShoppingCart },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/config", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={`px-4 py-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
            {isCollapsed ? (
              <img src={huskyIcon} alt="Togo" className="w-8 h-8" />
            ) : (
              <div className="flex items-center gap-3">
                <img src={huskyIcon} alt="Togo" className="w-10 h-10" />
                <h1 className="text-3xl font-black tracking-tight" style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  TOGO
                </h1>
              </div>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
