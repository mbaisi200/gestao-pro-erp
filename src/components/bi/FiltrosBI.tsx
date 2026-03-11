'use client';

import { FiltrosBI } from '@/types/bi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RefreshCw, X } from 'lucide-react';

interface FiltrosBIProps {
  filtros: FiltrosBI;
  periodoFormatado: string;
  opcoesFiltros: {
    categorias: { valor: string; label: string }[];
    formasPagamento: { valor: string; label: string }[];
    tiposVenda: { valor: string; label: string }[];
    produtos: { valor: string; label: string }[];
    canais: { valor: string; label: string }[];
  };
  onAtualizarFiltros: (filtros: Partial<FiltrosBI>) => void;
  onResetarFiltros: () => void;
}

export function FiltrosBI({ 
  filtros, 
  periodoFormatado, 
  opcoesFiltros, 
  onAtualizarFiltros, 
  onResetarFiltros 
}: FiltrosBIProps) {
  return (
    <Card className="border-2 border-primary/10">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{periodoFormatado}</span>
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            <Select
              value={filtros.periodo}
              onValueChange={(value) => onAtualizarFiltros({ periodo: value as FiltrosBI['periodo'] })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="ontem">Ontem</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Este Trimestre</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
              </SelectContent>
            </Select>

            {opcoesFiltros.formasPagamento.length > 0 && (
              <Select
                value={filtros.formasPagamento[0] || 'all'}
                onValueChange={(value) => onAtualizarFiltros({ formasPagamento: value === 'all' ? [] : [value] })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Forma Pgto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {opcoesFiltros.formasPagamento.map((op) => (
                    <SelectItem key={op.valor} value={op.valor}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {opcoesFiltros.tiposVenda.length > 0 && (
              <Select
                value={filtros.tiposVenda[0] || 'all'}
                onValueChange={(value) => onAtualizarFiltros({ tiposVenda: value === 'all' ? [] : [value] })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tipo Venda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {opcoesFiltros.tiposVenda.map((op) => (
                    <SelectItem key={op.valor} value={op.valor}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onResetarFiltros}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
