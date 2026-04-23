import React, { useState } from 'react';
import { Card, Select, Slider, Button, Space, Tooltip, Divider } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { VisionSimulationFilter } from '@/types';
import '../styles/vision-simulator.css';

interface VisionSimulatorProps {
  onFilterChange?: (filter: VisionSimulationFilter) => void;
}

export const VisionSimulator: React.FC<VisionSimulatorProps> = ({ onFilterChange }) => {
  const [filterType, setFilterType] = useState<VisionSimulationFilter['type']>('none');
  const [intensity, setIntensity] = useState(50);
  const [isActive, setIsActive] = useState(false);

  const filterOptions = [
    { label: 'Nenhum', value: 'none' },
    { label: 'Protanopia (Daltonismo Vermelho-Verde)', value: 'protanopia' },
    { label: 'Deuteranopia (Daltonismo Verde-Vermelho)', value: 'deuteranopia' },
    { label: 'Tritanopia (Daltonismo Azul-Amarelo)', value: 'tritanopia' },
    { label: 'Desfoque (Baixa Visão)', value: 'blur' },
  ];

  const handleFilterChange = (newType: VisionSimulationFilter['type']) => {
    setFilterType(newType);
    const filter: VisionSimulationFilter = {
      type: newType,
      intensity,
    };
    onFilterChange?.(filter);
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(value);
    const filter: VisionSimulationFilter = {
      type: filterType,
      intensity: value,
    };
    onFilterChange?.(filter);
  };

  const toggleSimulation = () => {
    const newActive = !isActive;
    setIsActive(newActive);

    onFilterChange?.({
      type: newActive ? filterType : 'none',
      intensity,
    });
  };

  return (
    <Card className="vision-simulator" title="Simulador de Visão">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Tooltip title="Ativa/desativa o simulador de visão">
          <Button
            type={isActive ? 'primary' : 'default'}
            icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={toggleSimulation}
            block
          >
            {isActive ? 'Simulador Ativo' : 'Ativar Simulador'}
          </Button>
        </Tooltip>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <label>Tipo de Deficiência Visual:</label>
          <Select
            value={filterType}
            onChange={handleFilterChange}
            options={filterOptions}
            disabled={!isActive}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Intensidade: {intensity}%</label>
          <Slider
            value={intensity}
            onChange={handleIntensityChange}
            disabled={!isActive || filterType === 'none'}
            min={0}
            max={100}
          />
        </div>

        <div className="simulator-info">
          <p>
            <strong>Protanopia:</strong> Dificuldade em distinguir vermelho e verde.
          </p>
          <p>
            <strong>Deuteranopia:</strong> Forma mais comum de daltonismo, afeta percepção de verde.
          </p>
          <p>
            <strong>Tritanopia:</strong> Rara, afeta percepção de azul e amarelo.
          </p>
          <p>
            <strong>Desfoque:</strong> Simula baixa visão ou miopia.
          </p>
        </div>
      </Space>
    </Card>
  );
};
