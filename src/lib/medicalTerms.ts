// Dicionário de mapeamento: termos coloquiais → termos médicos técnicos
const medicalDictionary: Record<string, string> = {
  // Membros
  'patinha da frente': 'membro torácico',
  'patinha de trás': 'membro pélvico',
  'pata da frente': 'membro torácico',
  'pata de trás': 'membro pélvico',
  'perna da frente': 'membro torácico',
  'perna de trás': 'membro pélvico',
  
  // Lesões e traumas
  'machucado': 'com lesão',
  'machucada': 'com lesão',
  'ferido': 'com contusão',
  'ferida': 'com lesão',
  'ralado': 'com escoriação',
  'ralada': 'com escoriação',
  'cortado': 'com laceração',
  'cortada': 'com laceração',
  
  // Estado geral
  'está cansado': 'apresenta letargia',
  'está cansada': 'apresenta letargia',
  'com febre': 'apresenta hipertermia',
  'febril': 'hipertérmico',
  'com dor': 'apresenta algia',
  'dolorido': 'com algia',
  'dolorida': 'com algia',
  'triste': 'apresenta apatia',
  'desanimado': 'apresenta prostração',
  'desanimada': 'apresenta prostração',
  'fraco': 'apresenta fraqueza generalizada',
  'fraca': 'apresenta fraqueza generalizada',
  
  // Sintomas gastrointestinais
  'vomitou': 'apresentou episódio de êmese',
  'vomitando': 'apresentando episódios de êmese',
  'está vomitando': 'apresenta episódios de êmese',
  'tá vomitando': 'apresenta episódios de êmese',
  'fez cocô mole': 'apresenta episódio de diarreia',
  'fazendo cocô mole': 'apresenta episódio de diarreia',
  'está fazendo cocô mole': 'apresenta episódio de diarreia',
  'tá fazendo cocô mole': 'apresenta episódio de diarreia',
  'com diarreia': 'apresenta episódio de diarreia',
  'diarreia': 'apresenta episódio de diarreia',
  'não quer comer': 'apresenta hiporexia',
  'não está comendo': 'apresenta anorexia',
  'não tá comendo': 'apresenta anorexia',
  'comendo pouco': 'apresenta hiporexia',
  'tá comendo pouco': 'apresenta hiporexia',
  
  // Respiratório
  'tossindo': 'apresenta tosse',
  'falta de ar': 'apresenta dispneia',
  'cansaço para respirar': 'apresenta dispneia',
  'nariz escorrendo': 'apresenta secreção nasal',
  
  // Pele e pelagem
  'coceira': 'prurido',
  'coçando': 'apresenta prurido',
  'pelo caindo': 'apresenta alopecia',
  'careca': 'área de alopecia',
  'vermelho': 'eritema',
  'vermelhidão': 'eritema',
  'inchado': 'edema',
  'inchada': 'edema',
  
  // Comportamento
  'agressivo': 'apresenta comportamento agressivo',
  'agitado': 'apresenta agitação',
  'nervoso': 'apresenta ansiedade',
  'com medo': 'apresenta quadro de ansiedade',
  
  // Olhos e ouvidos
  'olho vermelho': 'hiperemia conjuntival',
  'olhos vermelhos': 'hiperemia conjuntival bilateral',
  'secreção no olho': 'secreção ocular',
  'ouvido sujo': 'cerúmen em excesso',
  'orelha vermelha': 'pavilhão auricular eritematoso',
};

/**
 * Converte texto coloquial em terminologia médica técnica
 */
export function convertToMedicalTerms(text: string): string {
  if (!text || text.trim() === '') return text;
  
  let convertedText = text.toLowerCase();
  
  // Remove "o paciente" ou "a paciente" do início para evitar duplicação
  convertedText = convertedText.replace(/^(o paciente|a paciente)\s+/i, '');
  
  // Ordena as entradas do dicionário por tamanho (maior para menor) para evitar substituições parciais
  const sortedEntries = Object.entries(medicalDictionary).sort((a, b) => b[0].length - a[0].length);
  
  // Aplica todas as substituições do dicionário
  sortedEntries.forEach(([colloquial, technical]) => {
    // Escapa caracteres especiais do regex
    const escapedColloquial = colloquial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedColloquial, 'gi');
    convertedText = convertedText.replace(regex, technical);
  });
  
  // Capitaliza a primeira letra
  convertedText = convertedText.charAt(0).toUpperCase() + convertedText.slice(1);
  
  // Adiciona "Paciente" no início se não houver sujeito claro
  if (!convertedText.match(/^(paciente|animal)/i)) {
    convertedText = `Paciente ${convertedText}`;
  }
  
  return convertedText;
}
