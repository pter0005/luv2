import { redirect } from 'next/navigation';

export default function CreatePage() {
  // Simplifica o fluxo do usuário, redirecionando diretamente para a criação 
  // do plano avançado, conforme solicitado.
  redirect('/criar/fazer-eu-mesmo?plan=avancado&new=true');
  
  return null; // A função redirect lança um erro, então isso não será renderizado.
}
