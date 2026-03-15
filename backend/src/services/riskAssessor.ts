/**
 * System SterilGuard Pro - Moduł RiskAssessor
 * Drzewo decyzyjne do klasyfikacji ryzyka zgodnie z klasyfikacją Spauldinga
 *
 * Zgodnie z:
 * - Ustawa z dnia 5 grudnia 2008 r. o zapobieganiu oraz zwalczaniu zakażeń
 * - Wytycznymi GIS dla salonów beauty
 */

import { RiskCategory, ProcessStatus } from '../config/constants';
import { PhysicalParameters } from '../types';

/**
 * Narzędzie do klasyfikacji ryzyka
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: RiskCategory;
  requiresSterilization: boolean;
  recommendedProcess: SterilizationProcessType;
}

/**
 * Typ procesu sterylizacji
 */
export type SterilizationProcessType =
  | 'STERILIZATION_ONLY'
  | 'DISINFECTION_ONLY'
  | 'STERILIZATION_REQUIRED';

/**
 * Drzewo decyzyjne do klasyfikacji ryzyka
 */
export class RiskAssessor {
  /**
   * Klasyfikuje narzędzie na podstawie jego użycia
   * @param contactType - Jak narzędzie kontaktuje się z pacjentem
   * @param tissueDamage - Czy narusza ciągłość tkanek
   * @returns Kategorię ryzyka
   */
  classifyRisk(contactType: ContactType, tissueDamage: boolean): RiskCategory {
    if (tissueDamage || contactType === ContactType.STERILE_TISSUE) {
      return RiskCategory.HIGH;
    }

    if (contactType === ContactType.MUCOUS_MEMBRANE) {
      return RiskCategory.MEDIUM;
    }

    return RiskCategory.LOW;
  }

  /**
   * Określa wymagany proces dla kategorii ryzyka
   */
  getRequiredProcess(category: RiskCategory): SterilizationProcessType {
    switch (category) {
      case RiskCategory.HIGH:
        return 'STERILIZATION_REQUIRED';
      case RiskCategory.MEDIUM:
        return 'STERILIZATION_REQUIRED'; // Preferencyjnie sterylizacja
      case RiskCategory.LOW:
        return 'DISINFECTION_ONLY';
    }
  }

  /**
   * Sprawdza, czy wymagana jest pełna sterylizacja parowa
   */
  requiresSterilization(category: RiskCategory): boolean {
    return category !== RiskCategory.LOW;
  }

  /**
   * Pobiera minimalne parametry sterylizacji
   */
  getSterilizationParams(category: RiskCategory): PhysicalParameters {
    // Dla wyższych kategorii wymagane są te same parametry
    return {
      temperature: 134,  // °C
      pressure: 205,     // kPa (ok. 30 psi)
      time: 15           // minuty
    };
  }

  /**
   * Sprawdza, czy narzędzie pasuje do kategorii ryzyka
   */
  matchToolByUsage(
    category: RiskCategory,
    tools: Tool[]
  ): Tool[] {
    return tools.filter(tool => tool.category === category);
  }

  /**
   * Zwraca listę wszystkich narzędzi z ich klasyfikacją
   */
  getKnownTools(): Tool[] {
    return [
      // WYSOKIE RYZYKO - wymagana sterylizacja
      {
        id: 'high-1',
        name: 'Nożyki podologiczne',
        description: 'Narzędzia do usunięcia tkanek martwych',
        category: RiskCategory.HIGH,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },
      {
        id: 'high-2',
        name: 'Igły do makijażu permanentnego',
        description: 'Jednorazowe, ale uchwyty wymagają sterylizacji',
        category: RiskCategory.HIGH,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },
      {
        id: 'high-3',
        name: 'Pęsety do rzęs (metalowe)',
        description: 'Mogą mieć kontakt z błoną śluzową oka',
        category: RiskCategory.HIGH,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },
      {
        id: 'high-4',
        name: 'Nożyki do regulacji brwi',
        description: 'Narzędzia ostre kontaktujące się z błonami',
        category: RiskCategory.HIGH,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },

      // ŚREDNIE RYZYKO - wymagana sterylizacja lub dezynfekcja wysokiego stopnia
      {
        id: 'medium-1',
        name: 'Cążki do manicure',
        description: 'Mogą naruszać naskórek',
        category: RiskCategory.MEDIUM,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },
      {
        id: 'medium-2',
        name: 'Nożyczki do paznokci',
        description: 'Narzędzia ostre z接触 z naskórkiem',
        category: RiskCategory.MEDIUM,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },
      {
        id: 'medium-3',
        name: 'Pilniki ( metalowe )',
        description: 'Kontakt z naskórkiem',
        category: RiskCategory.MEDIUM,
        requiresSterilization: true,
        recommendedProcess: 'STERILIZATION_REQUIRED'
      },

      // NISKIE RYZYKO - wystarczy dezynfekcja
      {
        id: 'low-1',
        name: 'Szpatułki do wosku',
        description: 'Jednorazowe lub do dezynfekcji',
        category: RiskCategory.LOW,
        requiresSterilization: false,
        recommendedProcess: 'DISINFECTION_ONLY'
      },
      {
        id: 'low-2',
        name: 'Fryzurki do włosów',
        description: 'Kontakt z nieuszkodzoną skórą głowy',
        category: RiskCategory.LOW,
        requiresSterilization: false,
        recommendedProcess: 'DISINFECTION_ONLY'
      }
    ];
  }
}

/**
 * Typy kontaktu z pacjentem
 */
export enum ContactType {
  UNBROKEN_SKIN = 'UNBROKEN_SKIN',         // Nienaruszona skóra
  BROKEN_SKIN = 'BROKEN_SKIN',             // Uszkodzona skóra
  MUCOUS_MEMBRANE = 'MUCOUS_MEMBRANE',     // Błony śluzowe
  STERILE_TISSUE = 'STERILE_TISSUE'        // Jałowe tkanki
}

// Eksport singletona
export const riskAssessor = new RiskAssessor();
