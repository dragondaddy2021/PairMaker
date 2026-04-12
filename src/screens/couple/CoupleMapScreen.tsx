/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import SharedMapScreen from '../MapScreen';

interface Props {
  onNavigateToPlan?: () => void;
}

const CoupleMapScreen: React.FC<Props> = ({ onNavigateToPlan }) => (
  <SharedMapScreen onNavigateToPlan={onNavigateToPlan} />
);

export default CoupleMapScreen;
