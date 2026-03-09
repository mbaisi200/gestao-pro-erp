'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore, Module } from '@/store/app-store';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderOpen,
  Warehouse,
  DollarSign,
  ShoppingCart,
  LogOut,
  Settings,
  BarChart3,
  FileText,
  Truck,
  Wrench,
  Shield,
  Ruler,
  Tags,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';

const adminMenuItems: { id: Module; title: string; url: string; icon: React.ElementType }[] = [
  { id: 'dashboard', title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'pdv', title: 'PDV', url: '/pdv', icon: ShoppingCart },
  { id: 'clientes', title: 'Clientes', url: '/admin/clientes', icon: Users },
  { id: 'produtos', title: 'Produtos e Serviços', url: '/admin/produtos', icon: Tags },
  { id: 'categorias', title: 'Categorias', url: '/admin/categorias', icon: FolderOpen },
  { id: 'unidades', title: 'Unidades de Medida', url: '/admin/unidades', icon: Ruler },
  { id: 'estoque', title: 'Estoque', url: '/admin/estoque', icon: Warehouse },
  { id: 'financeiro', title: 'Financeiro', url: '/admin/financeiro', icon: DollarSign },
  { id: 'relatorios', title: 'Relatórios BI', url: '/admin/relatorios', icon: BarChart3 },
  { id: 'faturamento', title: 'Nota Fiscal de Entrada', url: '/admin/faturamento', icon: Receipt },
  { id: 'pedidos', title: 'Pedidos', url: '/admin/pedidos', icon: FileSpreadsheet },
  { id: 'operacional', title: 'Operacional', url: '/admin/operacional', icon: Wrench },
  { id: 'fornecedores', title: 'Fornecedores', url: '/admin/fornecedores', icon: Truck },
  { id: 'funcionarios', title: 'Funcionários', url: '/admin/funcionarios', icon: Users },
  { id: 'parametros', title: 'Parâmetros', url: '/admin/parametros', icon: Settings },
];

const masterMenuItems: { id: Module; title: string; url: string; icon: React.ElementType }[] = [
  { id: 'admin', title: 'Painel Admin', url: '/admin/master', icon: Shield },
];

export default function AppSidebar() {
  const { user, logout, tenant, isAuthenticated } = useAuthStore();
  const { currentModule, setModule } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  // Verificar se o usuário está autenticado
  const isAuthed = isAuthenticated && user;
  // Admin e Master têm acesso total
  const isAdmin = user?.role === 'admin' || user?.role === 'gerente';
  const isMaster = user?.role === 'master' || tenant?.id === 'admin-master';

  const handleLogout = async () => {
    try {
      await logout();
      // Limpar estado local
      localStorage.clear();
      sessionStorage.clear();
      // Redirecionar para página de login
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Forçar redirecionamento mesmo com erro
      router.push('/');
    }
  };

  // Usuários autenticados veem o menu principal
  const menuItems = isAuthed ? adminMenuItems : [];
  const masterItems = isMaster ? masterMenuItems : [];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-blue-100 bg-blue-50">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">GestãoPro</span>
            <span className="text-xs text-muted-foreground">ERP SaaS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || currentModule === item.id}
                    tooltip={item.title}
                    onClick={() => setModule(item.id)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isMaster && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {masterItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || currentModule === item.id}
                      tooltip={item.title}
                      onClick={() => setModule(item.id)}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-blue-100 bg-blue-50">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {user?.nome?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{user?.nome}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sair">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
