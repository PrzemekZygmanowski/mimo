# Dokument wymagań produktu (PRD) - Mimo

## 1. Przegląd produktu
Mimo to aplikacja zaprojektowana, aby wspierać osoby zmagające się z kryzysowymi stanami emocjonalnymi, depresją, wypaleniem oraz chronicznym spadkiem motywacji. Głównym celem jest przywrócenie poczucia kontroli u użytkowników poprzez codzienny check-in nastroju i energii oraz przydzielanie dopasowanych, mikro zadań. Kluczowymi funkcjami są:
- Check-in nastroju i energii dostosowujący zadanie do aktualnego stanu użytkownika.
- Udostępnienie jednego zadania dziennie, które ma charakter wspierający i empatyczny.
- Wizualizacja postępów w formie rosnącego "ogródka" symbolizującego rozwój użytkownika.
- Operacje CRUD z wykorzystaniem Supabase do zarządzania danymi.
- Mechanizmy logowania i bezpiecznego dostępu, obejmujące anonimowe logowanie i ewentualne uwierzytelnianie przez e-mail.

## 2. Problem użytkownika
Użytkownicy, którzy zmagają się z depresją, wypaleniem czy chronicznym spadkiem motywacji, często tracą poczucie kontroli nad swoim życiem. Brak jasnej struktury, wsparcia i dostosowanych działań sprawia, że trudno im znaleźć motywację, nawet do wykonania drobnych czynności. Aplikacja Mimo ma na celu:
- Przywrócenie poczucia kontroli poprzez codzienną interakcję.
- Zapewnienie wsparcia emocjonalnego poprzez empatyczne komunikaty.
- Umożliwienie łatwego monitorowania stanu emocjonalnego oraz postępów w codziennych zadaniach.

## 3. Wymagania funkcjonalne
- Umożliwienie codziennego check-inu, w którym użytkownik wpisuje poziom nastroju oraz energii.
- Generowanie pojedynczego, spersonalizowanego zadania na każdy dzień, opartego na wpisanych danych.
- Wyświetlanie empatycznych komunikatów po wykonaniu zadania, dostosowanych do stanu użytkownika.
- Wizualizacja postępów użytkownika w formie rosnącego "ogródka", symbolizującego rozwój emocjonalny.
- Implementacja operacji CRUD (tworzenie, odczyt, modyfikacja, usuwanie) przy użyciu Supabase.
- Bezpieczne mechanizmy logowania i autoryzacji, zapewniające ochronę danych użytkownika (anonimowe logowanie lub logowanie przez e-mail).
- Obsługa trybu offline, aby umożliwić korzystanie z kluczowych funkcji nawet przy ograniczonym dostępie do Internetu.

## 4. Granice produktu
- Produkt nie obejmuje zaawansowanych analiz danych ani rozbudowanych algorytmów personalizacji wykraczających poza ustalone reguły oparte na poziomie nastroju i energii.
- Funkcjonalności spoza MVP (np. rozbudowane interakcje społecznościowe, integracje z zewnętrznymi urządzeniami medycznymi) nie będą wdrażane w pierwszej wersji.
- System nie przewiduje real-time chatów ani interakcji między użytkownikami – skupia się wyłącznie na indywidualnym wsparciu.
- Rozbudowane funkcje administracyjne, monitoring czy raportowanie wykraczają poza początkowy zakres projektu.

## 5. Historyjki użytkowników

- ID: US-001
  Tytuł: Wykonanie codziennego check-inu
  Opis: Użytkownik loguje się do aplikacji, przeprowadza check-in nastroju oraz poziomu energii, po czym otrzymuje spersonalizowane zadanie na dany dzień.
  Kryteria akceptacji:
  - Użytkownik może wprowadzić dane dotyczące nastroju oraz energii.
  - System na podstawie wprowadzonych danych generuje odpowiednie zadanie.
  - Zadanie jest wyświetlane na głównym ekranie wraz z komunikatem zachęcającym do wykonania.

- ID: US-002
  Tytuł: Zadanie dla użytkownika o wysokiej energii
  Opis: Gdy użytkownik zgłasza wysoki poziom energii, system przydziela bardziej aktywizujące zadanie, mające na celu zwiększenie poczucia sprawczości.
  Kryteria akceptacji:
  - System rozpoznaje scenariusz użytkownika o wysokiej energii na podstawie check-inu.
  - Zadanie jest zaprojektowane tak, aby angażowało użytkownika do wykonania bardziej dynamicznej aktywności.
  - Użytkownik otrzymuje odpowiedni komunikat motywujący do podjęcia zadania.

- ID: US-003
  Tytuł: Postępowanie w przypadku pominięcia zadania
  Opis: Jeśli użytkownik zdecyduje się pominąć przydzielone zadanie, system wyświetla neutralny komunikat, informujący o możliwości wykonania zadania w późniejszym czasie oraz rejestruje taki przypadek.
  Kryteria akceptacji:
  - Użytkownik ma możliwość wybrania opcji pominięcia zadania.
  - System wyświetla komunikat, który jest neutralny, lecz wspierający.
  - Akcja pominięcia zadania jest zapisywana dla celów analizy retencji użytkowników.

- ID: US-004
  Tytuł: Uwierzytelnianie i bezpieczny dostęp
  Opis: Aplikacja umożliwia użytkownikowi bezpieczne logowanie poprzez anonimowe konto lub rejestrację za pomocą e-mail, gwarantując ochronę danych osobowych.
  Kryteria akceptacji:
  - Użytkownik ma możliwość wyboru metody logowania (anonimowo lub przez e-mail).
  - Dane użytkownika są szyfrowane, a system stosuje odpowiednie procedury bezpieczeństwa.
  - Dostęp do funkcji aplikacji jest zależny od pomyślnego logowania, a historia wykonywanych zadań jest powiązana z kontem użytkownika.

## 6. Metryki sukcesu
- Liczba codziennych check-inów wykonanych przez użytkowników.
- Wskaźniki retencji, mierzone na przestrzeni 7- oraz 30-dniowych okresów.
- Procent zadań wykonanych w stosunku do pominiętych.
- Subiektywna ocena poprawy nastroju użytkownika na podstawie feedbacku.
- Analiza jakości i efektywności spersonalizowanych zadań poprzez badania satysfakcji użytkownika.
