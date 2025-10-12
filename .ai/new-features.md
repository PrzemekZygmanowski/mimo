# Rekomendacje dotyczące nowych funkcjonalności

Poniższe punkty opisują propozycje zmian i rozszerzeń w systemie przydzielania zadań, sformułowane w sposób ułatwiający dalszą pracę nad projektem:

1. **Okres aktywności zadania**:
   - Zadanie przydzielone użytkownikowi pozostaje aktywne przez 24 godziny od momentu przydzielenia.

2. **Warunki realizacji nowego check-inu**:
   - Nowy check-in jest możliwy pod warunkiem, że:
     a. Aktualne zadanie zostało wykonane,
     b. Użytkownik wybrał opcję pominięcia zadania,
     c. Upłynęło 24 godziny od przydzielenia aktualnego zadania.

3. **Opcje dostępne przy wyświetleniu zadania**:
   - Użytkownik ma możliwość:
     - Wykonania zadania,
     - Całkowitej rezygnacji z aktualnego zadania,
     - Poproszenia o nowe zadanie.

4. **Limit ponownych próśb o nowe zadanie**:
   - Opcja "poproś o nowe zadanie" może być wykorzystana maksymalnie 3 razy w ciągu dnia.
   - W przypadku osiągnięcia limitu 3 prób bez wyboru zadania, system wyświetli neutralny komunikat.

5. **Mechanizm unikania powtórnego przydzielenia tych samych zadań**:
   - Należy wdrożyć mechanizm, który monitoruje ostatnio wykonane lub przydzielone zadania,
   - Zadania te powinny być wykluczone z ponownej alokacji.
   - Rozwiązanie może być oparte na dodatkowej logice w serwisie przydzielania zadań lub oznaczeniu flagą w tabeli `user_tasks`.

6. **System nagradzający wykonanie zadań**:
   - Proponowany system nagradzający ma być oparty na idei sadzenia drzew w lesie.
   - Użytkownik będzie zbierać drzewa na planszy o wymiarach 5x6, co symbolizuje postępy i sens podejmowanych działań.
   - System ten ma być intuicyjny i neutralny, podkreślając znaczenie wykonywania zadań.

7. **Limit dzienny zadań**:
   - Użytkownik może wykonać maksymalnie 3 zadania w ciągu jednego dnia.
