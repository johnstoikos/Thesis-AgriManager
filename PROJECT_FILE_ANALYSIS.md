# Αναλυτική Περιγραφή Αρχείων Project AgriManager

Το AgriManager είναι full-stack εφαρμογή διαχείρισης αγροτικής εκμετάλλευσης. Το backend βρίσκεται στον φάκελο `agri_manager` και είναι υλοποιημένο με Spring Boot, Java, JPA, PostgreSQL/PostGIS και JWT security. Το frontend βρίσκεται στον φάκελο `agrimanager-frontend` και είναι υλοποιημένο με React, Vite, Axios, React Router, Leaflet και Recharts.

## Backend

### Βασικά Αρχεία

#### `agri_manager/pom.xml`

- Ορίζει το backend ως Maven Spring Boot project.
- Χρησιμοποιεί Spring Boot `3.4.2` και Java `21`.
- Περιλαμβάνει dependencies για REST API μέσω `spring-boot-starter-web`.
- Περιλαμβάνει JPA/Hibernate μέσω `spring-boot-starter-data-jpa`.
- Περιλαμβάνει PostgreSQL driver για σύνδεση με τη βάση.
- Περιλαμβάνει `hibernate-spatial` και `jts-core` για γεωχωρικά δεδομένα.
- Περιλαμβάνει `jackson-datatype-jts` για JSON serialization/deserialization γεωμετριών.
- Περιλαμβάνει Spring Security και JWT βιβλιοθήκες για authentication.
- Περιλαμβάνει Spring Validation για validation σε DTOs.
- Περιλαμβάνει SpringDoc OpenAPI για Swagger documentation.
- Περιλαμβάνει Spring Boot test dependencies για unit και integration tests.

#### `agri_manager/src/main/resources/application.properties`

- Περιέχει βασικές ρυθμίσεις της Spring Boot εφαρμογής.
- Ορίζει σύνδεση σε PostgreSQL βάση `agrimanager_db`.
- Ορίζει `spring.jpa.hibernate.ddl-auto=update`, ώστε το schema να ενημερώνεται αυτόματα.
- Ενεργοποιεί SQL logging με `spring.jpa.show-sql=true`.
- Ορίζει PostGIS Hibernate dialect για υποστήριξη spatial πεδίων.
- Περιέχει API key για OpenWeather.
- Περιέχει JWT secret key και expiration configuration.
- Περιέχει ρυθμίσεις Groq API για το AI assistant.

#### `AgriManagerApplication.java`

- Είναι το entry point του Spring Boot backend.
- Περιέχει τη `main` μέθοδο που εκκινεί την εφαρμογή.
- Φορτώνει το Spring application context και όλα τα beans/controllers/services.

## Backend Model Layer

#### `model/User.java`

- Αναπαριστά τον χρήστη της εφαρμογής.
- Αντιστοιχίζεται στον πίνακα `users`.
- Περιέχει `id`, `username`, `email`, `password`, `fullName`, `phone` και `profilePhoto`.
- Το `username` και το `email` είναι μοναδικά.
- Περιέχει πεδίο `active`, ώστε ο admin να μπορεί να ενεργοποιεί ή να απενεργοποιεί λογαριασμούς.
- Περιέχει οικονομικά πεδία: `totalProfit`, `monthlyRevenue`, `monthlyExpenses`.
- Περιέχει ημερομηνίες περιόδων: `monthlyFinancialPeriodStart` και `profitPeriodStart`.
- Περιέχει `roles` ως `ElementCollection`, δηλαδή λίστα ρόλων σε ξεχωριστό πίνακα `user_roles`.
- Υποστηρίζει ρόλους όπως `ROLE_USER` και `ROLE_ADMIN`.

#### `model/Field.java`

- Αναπαριστά ένα χωράφι.
- Αντιστοιχίζεται στον πίνακα `fields`.
- Περιέχει όνομα χωραφιού, έκταση και γεωμετρικό όριο.
- Το πεδίο `boundary` είναι `Polygon` με SRID 4326 και αποθηκεύεται ως PostGIS geometry.
- Συνδέεται με έναν ιδιοκτήτη `User` μέσω `ManyToOne`.
- Η σχέση με τον χρήστη έχει `JsonIgnore`, ώστε να αποφεύγονται infinite loops στο JSON.
- Περιέχει αγρονομικά στοιχεία: `soilType`, `soilPh`, `irrigationType`.
- Συνδέεται με πολλές καλλιέργειες μέσω `OneToMany`.
- Έχει cascade delete προς τις καλλιέργειες, ώστε όταν διαγράφεται χωράφι να διαγράφονται και οι σχετικές καλλιέργειες.

#### `model/Crop.java`

- Αναπαριστά μια καλλιέργεια μέσα σε χωράφι.
- Αντιστοιχίζεται στον πίνακα `crops`.
- Περιέχει τύπο καλλιέργειας, ποικιλία και ημερομηνία φύτευσης.
- Περιέχει παραγωγή συγκομιδής σε κιλά (`harvestYield`).
- Περιέχει τιμή πώλησης ανά κιλό (`sellingPricePerKg`).
- Το `zoneBoundary` είναι polygon που δείχνει τη ζώνη της καλλιέργειας μέσα στο χωράφι.
- Συνδέεται με ένα `Field` μέσω `ManyToOne`.
- Συνδέεται με πολλές εργασίες μέσω `OneToMany`.
- Έχει cascade delete προς τις εργασίες, ώστε όταν διαγράφεται καλλιέργεια να διαγράφονται οι σχετικές εργασίες.

#### `model/Task.java`

- Αναπαριστά αγροτική εργασία πάνω σε συγκεκριμένη καλλιέργεια.
- Αντιστοιχίζεται στον πίνακα `tasks`.
- Περιέχει τύπο εργασίας, περιγραφή και ημερομηνία.
- Το `status` δείχνει αν είναι `PENDING` ή `COMPLETED`.
- Το `completionPercentage` δείχνει πρόοδο από 0 έως 100.
- Το `harvestedYieldAmount` χρησιμοποιείται ειδικά για εργασίες συγκομιδής.
- Το `cost` είναι το συνολικό κόστος εργασίας.
- Το `hourlyCost` είναι το κόστος ανά ώρα.
- Το `laborHours` είναι οι ώρες εργασίας.
- Το `bookedRevenue` αποθηκεύει το έσοδο που έχει ήδη καταχωρηθεί για συγκομιδή.
- Το `location` είναι `Point` με SRID 4326 και δείχνει τη θέση της εργασίας στον χάρτη.
- Συνδέεται με μια καλλιέργεια μέσω `ManyToOne`.

#### `model/FinancialRecord.java`

- Αναπαριστά οικονομική κίνηση.
- Αντιστοιχίζεται στον πίνακα `financial_records`.
- Αποθηκεύει πληροφορίες για ιδιοκτήτη, χωράφι, καλλιέργεια και εργασία.
- Περιέχει τύπο κίνησης `REVENUE` ή `EXPENSE`.
- Περιέχει ποσό, ποσότητα σε κιλά, τιμή μονάδας και ημερομηνία.
- Το `createdAt` συμπληρώνεται αυτόματα πριν την αποθήκευση.
- Το `recordDate` συμπληρώνεται αυτόματα με την τρέχουσα ημερομηνία αν δεν δοθεί.
- Χρησιμοποιείται για να διατηρείται οικονομικό ιστορικό ακόμα και αν διαγραφούν operational εγγραφές.

#### `model/FinancialRecordType.java`

- Είναι enum με δύο τιμές: `REVENUE` και `EXPENSE`.
- Το `REVENUE` χρησιμοποιείται για έσοδα από συγκομιδή.
- Το `EXPENSE` χρησιμοποιείται για κόστος εργασιών.
- Χρησιμοποιείται στο `FinancialRecord` για να ξεχωρίζει το είδος της οικονομικής κίνησης.

## Backend DTO Layer

#### `dto/LoginDTO.java`

- Χρησιμοποιείται στο login request.
- Περιέχει `username` και `password`.
- Έχει validation ώστε και τα δύο πεδία να είναι υποχρεωτικά.

#### `dto/UserRegistrationDTO.java`

- Χρησιμοποιείται για εγγραφή νέου χρήστη.
- Περιέχει `username`, `email`, `password` και `fullName`.
- Μεταφέρει τα δεδομένα από το frontend προς το `UserService`.

#### `dto/UserProfileDTO.java`

- Χρησιμοποιείται για προβολή και ενημέρωση προφίλ χρήστη.
- Περιέχει id, username, email, full name, phone, profile photo και roles.
- Το τηλέφωνο έχει validation ώστε να αποτελείται από ακριβώς 10 ψηφία.
- Χρησιμοποιείται από τα endpoints `/api/users/profile`.

#### `dto/FieldRequest.java`

- Χρησιμοποιείται όταν ο χρήστης δημιουργεί ή ενημερώνει χωράφι.
- Περιέχει όνομα, έκταση, τύπο εδάφους, pH, τύπο άρδευσης και boundary.
- Το `boundary` γίνεται deserialize απευθείας σε JTS `Polygon`.

#### `dto/FieldDTO.java`

- Χρησιμοποιείται για επιστροφή χωραφιών στο frontend.
- Περιέχει id, name, area, boundary, soilType, soilPh και irrigationType.
- Αποφεύγει να σταλεί ολόκληρο το entity `Field` μαζί με τον owner.

#### `dto/CropDTO.java`

- Χρησιμοποιείται για δημιουργία, ενημέρωση και προβολή καλλιεργειών.
- Περιέχει id, type, variety, plantingDate, harvestYield και sellingPricePerKg.
- Περιέχει `zoneBoundary` για τη γεωγραφική ζώνη της καλλιέργειας.
- Περιέχει `fieldId`, ώστε η καλλιέργεια να συνδέεται με συγκεκριμένο χωράφι.
- Περιέχει `zoneArea` και `coveragePercentage` για υπολογιστικά στοιχεία.

#### `dto/TaskDTO.java`

- Χρησιμοποιείται για μεταφορά δεδομένων εργασιών.
- Περιέχει τύπο εργασίας, περιγραφή, ημερομηνία, status και progress.
- Περιέχει οικονομικά πεδία όπως κόστος, κόστος ανά ώρα και καθαρό κέρδος συγκομιδής.
- Περιέχει `location` ως JTS `Point`.
- Περιέχει `cropId`, ώστε η εργασία να συνδέεται με καλλιέργεια.

#### `dto/DashboardDTO.java`

- Χρησιμοποιείται για τα βασικά στατιστικά του farmer dashboard.
- Περιέχει συνολικά χωράφια, ενεργές καλλιέργειες, εκκρεμείς εργασίες και συνολική έκταση.

#### `dto/FarmerStatsDTO.java`

- Χρησιμοποιείται για οικονομικά στατιστικά αγρότη.
- Περιέχει έσοδα μήνα, έξοδα μήνα και κέρδος εξαμήνου.
- Περιέχει και ημερομηνίες έναρξης/λήξης περιόδων.

#### `dto/AdminOverviewDTO.java`

- Χρησιμοποιείται στο admin dashboard.
- Περιέχει πλήθος αγροτών, χωραφιών και εργασιών.
- Περιέχει μηνιαία δραστηριότητα ολοκληρωμένων εργασιών.

#### `dto/AdminAnalyticsDTO.java`

- Χρησιμοποιείται για αναλυτικά admin analytics.
- Περιέχει συνολικά έξοδα, έσοδα, καθαρό κέρδος και συνολική παραγωγή.
- Περιέχει πλήθος χωραφιών, καλλιεργειών, εκκρεμών και ολοκληρωμένων εργασιών.
- Περιέχει μηνιαίες σειρές εσόδων/εξόδων.
- Περιέχει ανάλυση ανά χωράφι και δεδομένα για pie charts.

#### `dto/AdminFieldAnalyticsDTO.java`

- Χρησιμοποιείται ως γραμμή ανάλυσης για κάθε χωράφι στα admin analytics.
- Περιέχει όνομα χωραφιού, παραγωγή, έσοδα, έξοδα, τύπο εδάφους, pH και έκταση.

#### `dto/AdminUserDTO.java`

- Χρησιμοποιείται στη διαχείριση χρηστών από admin.
- Περιέχει id, username, email, fullName, active status και roles.

#### `dto/AdminUserStatsDTO.java`

- Χρησιμοποιείται για στατιστικά συγκεκριμένου χρήστη.
- Περιέχει πλήθος χωραφιών, καλλιεργειών, εργασιών, pending/completed εργασιών και συνολική έκταση.
- Περιέχει κόστος ολοκληρωμένων εργασιών, κατανομή καλλιεργειών και μηνιαία δραστηριότητα.

#### `dto/CropDistributionDTO.java`

- Χρησιμοποιείται για στατιστικά κατανομής καλλιεργειών.
- Περιέχει τύπο καλλιέργειας και συνολική έκταση.

#### `dto/MonthlyActivityDTO.java`

- Χρησιμοποιείται για μηνιαία δραστηριότητα.
- Περιέχει μήνα και πλήθος ολοκληρωμένων εργασιών.

#### `dto/WeatherInfo.java`

- Είναι απλοποιημένη απάντηση καιρού προς το frontend.
- Περιέχει θερμοκρασία, υγρασία, περιγραφή και icon.

#### `dto/WeatherResponse.java`

- Χρησιμοποιείται για mapping της απάντησης από OpenWeather.
- Διαβάζει τα πεδία `main` και `weather`.
- Εξάγει θερμοκρασία, υγρασία, περιγραφή και icon.

#### `dto/AiChatRequestDTO.java`

- Χρησιμοποιείται στο AI chat endpoint.
- Περιέχει μήνυμα χρήστη και γλώσσα.
- Έχει validation ώστε το μήνυμα να μην είναι κενό.

## Backend Repository Layer

#### `repository/UserRepository.java`

- Παρέχει CRUD λειτουργίες για `User`.
- Βρίσκει χρήστη με βάση το username.
- Έχει query με pessimistic write lock για οικονομικές ενημερώσεις.
- Βρίσκει όλους τους αγρότες, εξαιρώντας admin users.
- Βρίσκει συγκεκριμένο farmer με βάση id.
- Μετρά το πλήθος των farmers.

#### `repository/FieldRepository.java`

- Παρέχει CRUD λειτουργίες για `Field`.
- Βρίσκει χωράφια ανά username ιδιοκτήτη.
- Μετρά χωράφια ανά χρήστη.
- Βρίσκει χωράφι με id και username για ownership check.
- Βρίσκει όλα τα χωράφια farmers για admin analytics.
- Υπολογίζει συνολική έκταση χωραφιών χρήστη.

#### `repository/CropRepository.java`

- Παρέχει CRUD λειτουργίες για `Crop`.
- Βρίσκει καλλιέργειες ανά field id.
- Βρίσκει καλλιέργειες με βάση τον owner.
- Παρέχει queries για admin analytics ανά χρονικό διάστημα.
- Μετρά καλλιέργειες ανά farmer ή συνολικά.
- Υπολογίζει κατανομή καλλιεργειών ανά τύπο.

#### `repository/TaskRepository.java`

- Παρέχει CRUD λειτουργίες για `Task`.
- Βρίσκει εργασίες ανά crop id.
- Έχει pessimistic write lock για ενημέρωση προόδου εργασίας.
- Μετρά εργασίες ανά status και owner.
- Βρίσκει urgent pending tasks για ειδοποιήσεις.
- Υπολογίζει μηνιαία δραστηριότητα ολοκληρωμένων εργασιών.
- Υπολογίζει συνολικό κόστος ολοκληρωμένων εργασιών ανά owner.
- Παρέχει queries για admin analytics ανά διάστημα.

#### `repository/FinancialRecordRepository.java`

- Παρέχει CRUD λειτουργίες για οικονομικές εγγραφές.
- Βρίσκει οικονομικές κινήσεις ανά owner και ημερομηνιακό διάστημα.
- Βρίσκει οικονομικές κινήσεις συνολικά για συγκεκριμένο διάστημα.

## Backend Service Layer

#### `service/UserService.java`

- Υλοποιεί εγγραφή νέου χρήστη.
- Ελέγχει αν υπάρχει ήδη username.
- Κρυπτογραφεί password με BCrypt.
- Δίνει default ρόλο `ROLE_USER`.
- Αρχικοποιεί οικονομικά πεδία χρήστη.
- Υλοποιεί login και επιστρέφει JWT token.
- Ελέγχει αν ο λογαριασμός είναι ενεργός πριν το login.
- Παρέχει ανάκτηση χρήστη με username.
- Ενημερώνει profile, phone και profile photo.
- Αλλάζει password μετά από έλεγχο παλιού password.

#### `service/JwtService.java`

- Δημιουργεί JWT token για username.
- Εξάγει username από JWT token.
- Ελέγχει αν token είναι έγκυρο και μη ληγμένο.
- Υπογράφει token με HMAC SHA-256.
- Χρησιμοποιείται από login και από το JWT filter.

#### `service/FieldService.java`

- Διαχειρίζεται χωράφια.
- Επιστρέφει μόνο τα χωράφια του συνδεδεμένου χρήστη.
- Δημιουργεί χωράφι και το συνδέει με τον authenticated user.
- Μετατρέπει `Field` entity σε `FieldDTO`.
- Ενημερώνει στοιχεία χωραφιού και γεωμετρία.
- Ελέγχει ownership πριν από προβολή, ενημέρωση ή διαγραφή.
- Σε διαγραφή χωραφιού διατηρεί τα οικονομικά στοιχεία μέσω `UserProfitService`.

#### `service/CropService.java`

- Διαχειρίζεται καλλιέργειες.
- Ελέγχει ότι το χωράφι ανήκει στον τρέχοντα χρήστη.
- Ελέγχει ότι η γεωμετρική ζώνη καλλιέργειας βρίσκεται μέσα στο χωράφι.
- Αποθηκεύει τύπο, ποικιλία, ημερομηνία φύτευσης και οικονομικά στοιχεία συγκομιδής.
- Απαιτεί θετική τιμή πώλησης ανά κιλό.
- Υπολογίζει προσεγγιστικά έκταση ζώνης και ποσοστό κάλυψης.
- Σε διαγραφή καλλιέργειας διατηρεί τα οικονομικά σύνολα του χρήστη.

#### `service/TaskService.java`

- Διαχειρίζεται εργασίες.
- Ελέγχει ότι η καλλιέργεια ανήκει στον συνδεδεμένο χρήστη.
- Ελέγχει ότι το σημείο εργασίας είναι μέσα στη ζώνη καλλιέργειας.
- Δημιουργεί εργασίες με task type, description, date, progress και status.
- Υπολογίζει κόστος ως `hourlyCost * laborHours`.
- Ελέγχει ότι κόστος ανά ώρα και ώρες εργασίας συμπληρώνονται μαζί.
- Για συγκομιδή απαιτεί ποσότητα παραγωγής όταν η πρόοδος γίνεται 100%.
- Για ολοκληρωμένη συγκομιδή αυξάνει το `harvestYield` της καλλιέργειας.
- Υπολογίζει booked revenue για συγκομιδή.
- Δημιουργεί financial records για έσοδα και έξοδα.
- Ενημερώνει οικονομικά σύνολα χρήστη μέσω `UserProfitService`.
- Δεν επιτρέπει σε ολοκληρωμένη εργασία να επιστρέψει σε μικρότερη πρόοδο.
- Δεν επιτρέπει αλλαγή τύπου ή καλλιέργειας σε ολοκληρωμένη εργασία.

#### `service/UserProfitService.java`

- Διαχειρίζεται οικονομικά σύνολα χρήστη.
- Κρατά μηνιαία έσοδα, μηνιαία έξοδα και κέρδος εξαμήνου.
- Χρησιμοποιεί pessimistic lock όταν ενημερώνει οικονομικά δεδομένα.
- Αρχικοποιεί οικονομικές περιόδους αν είναι κενές.
- Μηδενίζει μηνιαία στοιχεία όταν αλλάζει μήνας.
- Μηδενίζει κέρδος όταν αλλάζει ημερολογιακό εξάμηνο.
- Υπολογίζει revenue από ολοκληρωμένες συγκομιδές.
- Υπολογίζει expenses από κόστη εργασιών.
- Επιτρέπει reset συγκεκριμένων οικονομικών πεδίων ή όλων μαζί.
- Διατηρεί οικονομικά στοιχεία όταν διαγράφονται χωράφια, καλλιέργειες ή εργασίες.

#### `service/FinancialRecordService.java`

- Δημιουργεί ιστορικές οικονομικές εγγραφές.
- Καταγράφει έσοδα συγκομιδής ως `REVENUE`.
- Καταγράφει κόστος εργασίας ως `EXPENSE`.
- Συνδέει κάθε οικονομική εγγραφή με owner, field, crop και task.
- Δεν αποθηκεύει μηδενικές κινήσεις.
- Παρέχει ανάκτηση οικονομικών εγγραφών για admin analytics.

#### `service/StatsService.java`

- Παρέχει στατιστικά για τον απλό αγρότη.
- Υπολογίζει συνολικά χωράφια, ενεργές καλλιέργειες, pending εργασίες και συνολική έκταση.
- Επιστρέφει οικονομικά στατιστικά από `UserProfitService`.
- Υποστηρίζει reset οικονομικών στατιστικών.

#### `service/AdminStatsService.java`

- Παρέχει συνοπτικά admin στατιστικά.
- Μετρά συνολικούς farmers, χωράφια και εργασίες.
- Υπολογίζει μηνιαία δραστηριότητα ολοκληρωμένων εργασιών.
- Υπολογίζει συνολική κατανομή καλλιεργειών ανά τύπο.

#### `service/AdminAnalyticsService.java`

- Παρέχει αναλυτικά admin analytics.
- Υποστηρίζει προβολή για όλους τους farmers ή για συγκεκριμένο farmer.
- Υποστηρίζει χρονικά φίλτρα: μήνας, έξι μήνες, έτος.
- Υπολογίζει συνολικά έσοδα, έξοδα, καθαρό κέρδος και παραγωγή.
- Υπολογίζει πλήθος χωραφιών, καλλιεργειών, pending και completed εργασιών.
- Δημιουργεί μηνιαίες σειρές εσόδων και εξόδων.
- Δημιουργεί breakdown ανά χωράφι.
- Χρησιμοποιεί `FinancialRecordService` για ιστορικά οικονομικά στοιχεία συγκεκριμένου farmer.

#### `service/AdminUserService.java`

- Διαχειρίζεται χρήστες από την πλευρά του admin.
- Επιστρέφει όλους τους farmers.
- Επιτρέπει διαγραφή farmer.
- Πριν τη διαγραφή χρήστη διαγράφει πρώτα τα χωράφια του, ώστε να καθαριστούν οι σχετικές καλλιέργειες και εργασίες.
- Επιτρέπει ενεργοποίηση και απενεργοποίηση χρήστη.
- Επιστρέφει χωράφια συγκεκριμένου χρήστη.
- Επιτρέπει διαγραφή χωραφιού συγκεκριμένου χρήστη.
- Επιστρέφει στατιστικά ανά χρήστη.

#### `service/WeatherService.java`

- Παίρνει καιρικά δεδομένα για συγκεκριμένο χωράφι.
- Βρίσκει το χωράφι από τη βάση.
- Υπολογίζει το centroid του polygon.
- Καλεί OpenWeather API με latitude και longitude.
- Επιστρέφει θερμοκρασία, υγρασία, περιγραφή και icon.

#### `service/AiAssistantService.java`

- Υλοποιεί την επικοινωνία με το Groq API.
- Ελέγχει αν έχει οριστεί Groq API key.
- Δημιουργεί system instruction για ελληνικά ή αγγλικά.
- Προσαρμόζει τη γλώσσα απάντησης με βάση το μήνυμα και τη γλώσσα εφαρμογής.
- Χτίζει user prompt με τα δεδομένα χωραφιών και καλλιεργειών.
- Καλεί endpoint συμβατό με OpenAI chat completions.
- Εξάγει την απάντηση του assistant από το JSON response.

## Backend Controller Layer

#### `controller/AuthController.java`

- Εκθέτει endpoints για authentication.
- `POST /api/auth/register`: εγγραφή νέου χρήστη.
- `POST /api/auth/login`: σύνδεση και επιστροφή JWT token.

#### `controller/UserController.java`

- Εκθέτει endpoints για προφίλ χρήστη.
- `GET /api/users/profile`: επιστρέφει το προφίλ του authenticated user.
- `PUT /api/users/profile`: ενημερώνει στοιχεία προφίλ.
- `PUT /api/users/profile/change-password`: αλλάζει password.

#### `controller/FieldController.java`

- Εκθέτει endpoints για χωράφια.
- `POST /api/fields`: δημιουργεί νέο χωράφι.
- `GET /api/fields`: επιστρέφει τα χωράφια του χρήστη.
- `GET /api/fields/{id}`: επιστρέφει συγκεκριμένο χωράφι.
- `PUT /api/fields/{id}`: ενημερώνει χωράφι.
- `DELETE /api/fields/{id}`: διαγράφει χωράφι.

#### `controller/CropController.java`

- Εκθέτει endpoints για καλλιέργειες.
- `POST /api/crops`: δημιουργεί καλλιέργεια.
- `GET /api/crops/field/{fieldId}`: επιστρέφει καλλιέργειες ενός χωραφιού.
- `PUT /api/crops/{id}`: ενημερώνει καλλιέργεια.
- `DELETE /api/crops/{id}`: διαγράφει καλλιέργεια.

#### `controller/TaskController.java`

- Εκθέτει endpoints για εργασίες.
- `POST /api/tasks`: δημιουργεί εργασία.
- `GET /api/tasks/crop/{cropId}`: επιστρέφει εργασίες καλλιέργειας.
- `GET /api/tasks/notifications`: επιστρέφει urgent pending tasks.
- `PUT /api/tasks/{id}`: ενημερώνει εργασία.
- `PATCH /api/tasks/{id}/progress`: ενημερώνει πρόοδο εργασίας.
- `DELETE /api/tasks/{id}`: διαγράφει εργασία.

#### `controller/StatsController.java`

- Εκθέτει endpoints για farmer statistics.
- `GET /api/stats/dashboard`: επιστρέφει βασικά dashboard counts.
- `GET /api/stats/farmer-dashboard`: επιστρέφει οικονομικά στοιχεία αγρότη.
- `DELETE /api/stats/financial/{target}`: μηδενίζει επιλεγμένα οικονομικά στοιχεία.

#### `controller/WeatherController.java`

- Εκθέτει endpoint καιρού.
- `GET /api/weather/field/{fieldId}`: επιστρέφει καιρό για το κέντρο του χωραφιού.

#### `controller/AiAssistantController.java`

- Εκθέτει endpoint AI assistant.
- `POST /api/ai/chat`: δέχεται μήνυμα χρήστη και επιστρέφει απάντηση AI.
- Χτίζει context prompt από τα χωράφια και τις καλλιέργειες του χρήστη.
- Αν ο χρήστης είναι admin, μπορεί να χρησιμοποιήσει ευρύτερο context.

#### `controller/AdminStatsController.java`

- Εκθέτει συνοπτικά admin statistics.
- `GET /api/admin/stats/overview`: επιστρέφει συνολικούς farmers, χωράφια, εργασίες και μηνιαία δραστηριότητα.
- `GET /api/admin/stats/crops-dist`: επιστρέφει κατανομή καλλιεργειών.

#### `controller/AdminAnalyticsController.java`

- Εκθέτει admin analytics.
- `GET /api/admin/analytics`: επιστρέφει οικονομικά και παραγωγικά analytics.
- Δέχεται optional `userId` και `range`.

#### `controller/AdminUserController.java`

- Εκθέτει endpoints διαχείρισης χρηστών.
- `GET /api/admin/users`: επιστρέφει farmers.
- `DELETE /api/admin/users/{id}`: διαγράφει farmer.
- `PATCH /api/admin/users/{id}/activate`: ενεργοποιεί farmer.
- `PATCH /api/admin/users/{id}/deactivate`: απενεργοποιεί farmer.
- `GET /api/admin/users/{id}/stats`: επιστρέφει στατιστικά farmer.
- `GET /api/admin/users/{id}/fields`: επιστρέφει χωράφια farmer.
- `DELETE /api/admin/users/{userId}/fields/{fieldId}`: διαγράφει χωράφι farmer.

## Backend Configuration

#### `config/SecurityConfig.java`

- Ρυθμίζει το Spring Security.
- Απενεργοποιεί CSRF επειδή το API λειτουργεί stateless με JWT.
- Ορίζει session policy ως `STATELESS`.
- Επιτρέπει δημόσια πρόσβαση στο `/api/auth/**`.
- Επιτρέπει Swagger endpoints.
- Περιορίζει τα `/api/admin/**` σε χρήστες με ρόλο admin.
- Προσθέτει το `JwtAuthenticationFilter` πριν από το username/password filter.
- Ρυθμίζει CORS για το frontend σε `localhost:5173` και `localhost:5174`.

#### `config/JwtAuthenticationFilter.java`

- Εκτελείται σε κάθε request.
- Διαβάζει το `Authorization` header.
- Αν υπάρχει `Bearer` token, εξάγει το username.
- Ελέγχει αν το token είναι έγκυρο.
- Φορτώνει τους ρόλους του χρήστη από τη βάση.
- Αν ο χρήστης είναι απενεργοποιημένος, επιστρέφει 401.
- Γεμίζει το Spring Security context με authenticated user.

#### `config/JacksonConfig.java`

- Δηλώνει JTS module για Jackson.
- Επιτρέπει σωστό JSON mapping για γεωμετρίες όπως `Polygon` και `Point`.

#### `config/OpenApiConfig.java`

- Ρυθμίζει OpenAPI metadata.
- Χρησιμοποιείται για Swagger documentation του REST API.

#### `exception/GlobalExceptionHandler.java`

- Πιάνει exceptions σε επίπεδο controller.
- Για `RuntimeException` επιστρέφει HTTP 400.
- Για `IllegalStateException` επιστρέφει HTTP 503.
- Επιστρέφει JSON με `timestamp`, `message` και `status`.

## Frontend

### Βασικά Αρχεία

#### `agrimanager-frontend/package.json`

- Ορίζει το frontend ως Vite React project.
- Περιέχει scripts για `dev`, `build`, `lint` και `preview`.
- Χρησιμοποιεί React 19.
- Χρησιμοποιεί React Router για routing.
- Χρησιμοποιεί Axios για HTTP requests.
- Χρησιμοποιεί Leaflet, React Leaflet και Geoman για χάρτες.
- Χρησιμοποιεί Turf.js για γεωμετρικούς υπολογισμούς.
- Χρησιμοποιεί Recharts για γραφήματα.
- Χρησιμοποιεί jsPDF, jspdf-autotable και html2canvas για PDF export.
- Χρησιμοποιεί lucide-react για icons.

#### `src/main.jsx`

- Είναι το entry point του React frontend.
- Κάνει render το `App` component στο DOM.
- Φορτώνει τα βασικά CSS αρχεία.

#### `src/App.jsx`

- Ορίζει όλο το routing της εφαρμογής.
- Χρησιμοποιεί `BrowserRouter`, `Routes` και `Route`.
- Τυλίγει την εφαρμογή με `ThemeProvider`, `AppPreferencesProvider` και `AuthProvider`.
- Περιέχει protected routes με role guard.
- Οι farmer routes εμφανίζονται μέσα από `AppShell`.
- Οι admin routes εμφανίζονται μέσα από `AdminShell`.
- Αν ο χρήστης δεν είναι authenticated, γίνεται redirect στο login.
- Αν ο ρόλος δεν επιτρέπεται, γίνεται redirect στο σωστό home path.

#### `src/api/axios.js`

- Δημιουργεί κοινό Axios instance.
- Ορίζει base URL `http://localhost:8080`.
- Διαβάζει JWT από `localStorage` ή `sessionStorage`.
- Προσθέτει αυτόματα `Authorization: Bearer ...` σε κάθε request.
- Δεν στέλνει Authorization header στο login endpoint.
- Σε HTTP 401 καθαρίζει αποθηκευμένα στοιχεία authentication.
- Μεταφέρει τον χρήστη πίσω στο `/login`.

#### `src/i18n.jsx`

- Περιέχει μεταφράσεις για ελληνικά και αγγλικά.
- Παρέχει `AppPreferencesProvider`.
- Παρέχει hooks όπως `useAppPreferences` και `useLanguage`.
- Χρησιμοποιείται από σχεδόν όλα τα components για labels, placeholders και μηνύματα.
- Συνδέεται με το theme context ώστε η εφαρμογή να έχει κοινές προτιμήσεις χρήστη.

#### `src/index.css` και `src/App.css`

- Περιέχουν global CSS.
- Ρυθμίζουν βασικό styling, Tailwind utilities και εφαρμοστικά styles.

## Frontend Context και Utilities

#### `src/context/AuthContext.jsx`

- Κρατά την κατάσταση authentication.
- Φορτώνει το profile του χρήστη με βάση το αποθηκευμένο JWT.
- Παρέχει `loginWithToken`, `clearAuth` και `updateUser`.
- Αποθηκεύει profile στο `localStorage`.
- Αν το token αποτύχει, καθαρίζει authentication και κάνει redirect στο login.

#### `src/context/auth-context.js`

- Δημιουργεί και εξάγει το `AuthContext`.
- Παρέχει το hook `useAuth`.
- Χρησιμοποιείται από components που χρειάζονται στοιχεία χρήστη ή auth functions.

#### `src/context/ThemeContext.jsx`

- Κρατά το theme της εφαρμογής.
- Υποστηρίζει light και dark mode.
- Αποθηκεύει την επιλογή στο `localStorage`.
- Προσθέτει ή αφαιρεί την class `dark` στο root HTML element.

#### `src/utils/auth.js`

- Παρέχει helper functions για ρόλους χρήστη.
- Το `getUserRoles` επιστρέφει roles από το profile.
- Το `getHomePath` αποφασίζει αν ο χρήστης πρέπει να πάει σε farmer ή admin dashboard.

#### `src/utils/taskProgress.js`

- Περιέχει helper logic για πρόοδο εργασιών.
- Αναγνωρίζει αν ένας τύπος εργασίας είναι συγκομιδή.
- Υπολογίζει effective progress από `completionPercentage` ή `status`.

#### `src/utils/landUseValidation.js`

- Καλεί Overpass API.
- Ελέγχει αν οι συντεταγμένες ή το polygon ανήκουν σε κατοικημένη/οικιστική ζώνη.
- Αν εντοπιστεί residential area ή building, αποτρέπει την αποθήκευση χωραφιού.
- Χρησιμοποιεί simplified polygon filter για να μην γίνονται υπερβολικά μεγάλα queries.
- Εμφανίζει alert στον χρήστη αν η περιοχή δεν είναι αποδεκτή.

## Frontend Layout Components

#### `src/components/AppShell.jsx`

- Είναι το βασικό layout για farmer χρήστες.
- Περιέχει navigation, top bar, settings dropdown και notification area.
- Φορτώνει urgent task notifications από `/api/tasks/notifications`.
- Επιτρέπει γρήγορη ενημέρωση προόδου εργασιών από notifications.
- Περιέχει calendar popover με εργασίες.
- Εμφανίζει το `AiAssistantWidget`.
- Περιέχει `Outlet` για να προβάλλονται οι farmer σελίδες.

#### `src/components/AdminShell.jsx`

- Είναι το βασικό layout για admin χρήστες.
- Περιέχει admin navigation.
- Περιέχει settings dropdown και logout.
- Περιέχει `Outlet` για admin pages.
- Διαχωρίζει καθαρά το admin περιβάλλον από το farmer περιβάλλον.

#### `src/components/Navbar.jsx`

- Παλιότερο/simple navbar component.
- Περιέχει logout logic που καθαρίζει localStorage και sessionStorage.
- Μπορεί να χρησιμοποιείται ως βοηθητικό component ή να έχει μείνει από προηγούμενη έκδοση.

#### `src/components/ui.jsx`

- Περιέχει reusable UI components.
- Περιλαμβάνει `Button`, `Surface`, `Popover`, `Switch`, `PageHeader`, `StatCard`, `StatusBadge`.
- Περιλαμβάνει `EmptyState`, `ErrorState`, `SkeletonLines`.
- Περιλαμβάνει `SectionCard`, `ModalShell`, `FieldLabel`, `FieldInput`, `FieldTextarea`, `FieldSelect`.
- Χρησιμοποιείται για συνεπές styling σε όλη την εφαρμογή.

## Frontend Authentication Pages

#### `src/components/auth/AuthLayout.jsx`

- Παρέχει κοινό layout για login και signup.
- Δέχεται title, subtitle, children και footer.
- Χρησιμοποιείται για ενιαία εμφάνιση authentication σελίδων.

#### `src/components/auth/Login.jsx`

- Υλοποιεί τη φόρμα σύνδεσης.
- Στέλνει username και password στο `/api/auth/login`.
- Αν η σύνδεση πετύχει, αποθηκεύει JWT.
- Υποστηρίζει πιθανό auth error message από sessionStorage.
- Μετά το login μεταφέρει τον χρήστη στο σωστό dashboard με βάση τον ρόλο.

#### `src/components/auth/Signup.jsx`

- Υλοποιεί τη φόρμα εγγραφής.
- Στέλνει στοιχεία στο `/api/auth/register`.
- Μετά την εγγραφή κάνει login.
- Αποθηκεύει JWT και μεταφέρει τον χρήστη στο farmer dashboard.

## Frontend Farmer Pages

#### `src/components/Dashboard.jsx`

- Είναι η αρχική σελίδα farmer.
- Φορτώνει βασικά στατιστικά από `/api/stats/dashboard`.
- Φορτώνει οικονομικά στοιχεία από `/api/stats/farmer-dashboard`.
- Φορτώνει χωράφια, καλλιέργειες, εργασίες και καιρό για context.
- Αποθηκεύει context στο `localStorage` για χρήση από assistant/advisor.
- Εμφανίζει stat cards για χωράφια, καλλιέργειες, pending tasks, έξοδα και έσοδα.
- Εμφανίζει χάρτη με τα χωράφια του χρήστη.

#### `src/components/Fields.jsx`

- Διαχειρίζεται τη λίστα χωραφιών του χρήστη.
- Φορτώνει χωράφια από `/api/fields`.
- Επιτρέπει δημιουργία, επεξεργασία και διαγραφή χωραφιού.
- Χρησιμοποιεί `MapComponent` για σχεδίαση polygon.
- Υπολογίζει αυτόματα έκταση με Turf.js.
- Επιτρέπει εισαγωγή συντεταγμένων χειροκίνητα.
- Καλεί `validateLandUse` πριν την αποθήκευση.
- Στέλνει field payload στο backend με name, area, boundary, soil type, pH και irrigation type.

#### `src/components/FieldCrops.jsx`

- Διαχειρίζεται τις καλλιέργειες και εργασίες ενός συγκεκριμένου χωραφιού.
- Φορτώνει το χωράφι από `/api/fields/{fieldId}`.
- Φορτώνει τις καλλιέργειες από `/api/crops/field/{fieldId}`.
- Φορτώνει καιρικά δεδομένα από `/api/weather/field/{fieldId}`.
- Επιτρέπει δημιουργία και επεξεργασία καλλιέργειας.
- Ελέγχει ότι η τιμή πώλησης ανά κιλό είναι θετική.
- Επιτρέπει δημιουργία και επεξεργασία εργασίας πάνω σε καλλιέργεια.
- Χρησιμοποιεί Turf.js για να ελέγξει ότι το σημείο εργασίας βρίσκεται μέσα στη ζώνη της καλλιέργειας.
- Υποστηρίζει task progress update μέσω `/api/tasks/{taskId}/progress`.
- Υποστηρίζει διαγραφή καλλιέργειας.
- Καλεί Wikipedia API για σύντομη πληροφορία καλλιέργειας ή ποικιλίας.
- Προβάλλει weather widget και προειδοποιήσεις για άνεμο/βροχή.

#### `src/components/GlobalTasks.jsx`

- Παρέχει συγκεντρωτική προβολή όλων των εργασιών του χρήστη.
- Φορτώνει όλα τα χωράφια, μετά όλες τις καλλιέργειες και μετά όλες τις εργασίες.
- Δημιουργεί lookup για να συνδέει κάθε task με crop και field.
- Υποστηρίζει φίλτρα ανά status, task type και search text.
- Υποστηρίζει λίστα εργασιών και ημερολογιακή προβολή.
- Υποστηρίζει άμεση ενημέρωση προόδου εργασιών.
- Υποστηρίζει διαγραφή εργασιών.
- Υποστηρίζει δημιουργία νέας εργασίας με επιλογή χωραφιού.
- Εξάγει PDF ημερολόγιο εργασιών με pending και completed sections.

#### `src/components/Analytics.jsx`

- Παρέχει analytics για τον farmer.
- Φορτώνει χωράφια, οικονομικά στοιχεία, καλλιέργειες και εργασίες.
- Υπολογίζει συνολική έκταση, ενεργές ζώνες, pending/completed tasks και completion rate.
- Ομαδοποιεί καλλιέργειες ανά τύπο.
- Ομαδοποιεί εργασίες ανά status.
- Προβάλλει οικονομική σύνοψη με έσοδα, έξοδα και κέρδος εξαμήνου.
- Υποστηρίζει reset οικονομικών δεδομένων μέσω `/api/stats/financial/{target}`.
- Υποστηρίζει export σε PDF με html2canvas και jsPDF.

#### `src/components/Profile.jsx`

- Επιτρέπει στον χρήστη να ενημερώσει το προφίλ του.
- Εμφανίζει και επεξεργάζεται πλήρες όνομα, τηλέφωνο και profile photo.
- Ελέγχει ότι το τηλέφωνο έχει 10 ψηφία.
- Επιτρέπει upload/preview φωτογραφίας μέσω FileReader.
- Στέλνει αλλαγές profile στο backend.
- Υποστηρίζει αλλαγή password μέσω `/api/users/profile/change-password`.

#### `src/components/TaskProgressControl.jsx`

- Είναι reusable component για ενημέρωση προόδου εργασίας.
- Εμφανίζει slider από 0 έως 100.
- Για εργασίες συγκομιδής εμφανίζει input για ποσότητα σε κιλά.
- Δεν επιτρέπει αλλαγές αν η εργασία είναι ήδη ολοκληρωμένη.
- Καλεί callback `onSave` ώστε η σελίδα να κάνει το αντίστοιχο API call.

#### `src/components/MapComponent.jsx`

- Είναι το κεντρικό component χάρτη.
- Χρησιμοποιεί React Leaflet για προβολή χάρτη.
- Χρησιμοποιεί OpenStreetMap tiles.
- Χρησιμοποιεί Geoman controls για σχεδίαση polygon.
- Χρησιμοποιεί Turf.js για υπολογισμό έκτασης polygon.
- Εμφανίζει χωράφια, καλλιέργειες και εργασίες.
- Υποστηρίζει click στον χάρτη για επιλογή σημείου εργασίας.
- Υποστηρίζει αυτόματο κεντράρισμα σε χωράφι, καλλιέργεια ή εργασία.
- Χρησιμοποιεί custom markers ανά τύπο εργασίας.

#### `src/components/AgriAdvisor.jsx`

- Δημιουργεί έξυπνες ειδοποιήσεις με βάση καιρό και στοιχεία εδάφους.
- Αν το έδαφος είναι αμμώδες και η θερμοκρασία υψηλή, προτείνει πότισμα.
- Αν ο άνεμος είναι υψηλός, προτείνει αναβολή ψεκασμού.
- Αν υπάρχει μεγάλη πιθανότητα βροχής, προτείνει ολοκλήρωση εξωτερικών εργασιών.
- Εμφανίζει κατάσταση all clear όταν δεν υπάρχουν ειδοποιήσεις.

#### `src/components/AiAssistantWidget.jsx`

- Είναι floating AI chat widget.
- Ανοίγει ως sidebar.
- Στέλνει μήνυμα στο `/api/ai/chat`.
- Στέλνει και τη γλώσσα εφαρμογής.
- Εμφανίζει ιστορικό συνομιλίας.
- Διαχειρίζεται loading state και error messages.

#### `src/components/FieldCrops.jsx` και `src/components/MapComponent.jsx` μαζί

- Αυτά τα δύο αρχεία συνεργάζονται στενά.
- Το `FieldCrops` κρατά τα δεδομένα χωραφιού, καλλιεργειών και εργασιών.
- Το `MapComponent` εμφανίζει τα δεδομένα στον χάρτη και επιστρέφει selected polygons/points.
- Η συνεργασία τους επιτρέπει τη χωρική διαχείριση της αγροτικής εκμετάλλευσης.

## Frontend Admin Pages

#### `src/components/AdminDashboard.jsx`

- Εμφανίζει συνοπτικά admin statistics.
- Φορτώνει overview από `/api/admin/stats/overview`.
- Φορτώνει crop distribution από `/api/admin/stats/crops-dist` όταν χρειάζεται.
- Εμφανίζει stat cards για farmers, fields και tasks.
- Εμφανίζει pie chart για κατανομή καλλιεργειών.

#### `src/components/CropStatistics.jsx`

- Είναι η κύρια σελίδα admin analytics.
- Φορτώνει λίστα farmers από `/api/admin/users`.
- Φορτώνει analytics από `/api/admin/analytics`.
- Υποστηρίζει επιλογή συγκεκριμένου farmer ή όλων των farmers.
- Υποστηρίζει χρονικό φίλτρο: month, six months, year.
- Εμφανίζει έσοδα, έξοδα, καθαρό κέρδος και συνολική παραγωγή.
- Εμφανίζει μηνιαία γραφήματα εσόδων/εξόδων.
- Εμφανίζει breakdown ανά χωράφι όταν έχει επιλεγεί farmer.
- Υποστηρίζει export σε PDF με πίνακες.

#### `src/components/AdminUsersManagement.jsx`

- Διαχειρίζεται farmers από την πλευρά του admin.
- Φορτώνει users από `/api/admin/users`.
- Φιλτράρει ώστε να εμφανίζονται μόνο απλοί farmers και όχι admins.
- Επιτρέπει διαγραφή farmer.
- Επιτρέπει ενεργοποίηση και απενεργοποίηση farmer.
- Επιτρέπει επέκταση γραμμής χρήστη για προβολή χωραφιών του.
- Επιτρέπει διαγραφή συγκεκριμένου χωραφιού farmer.
- Εμφανίζει loading, empty και error states.

## Frontend Assets και Public Files

#### `public/fonts/LiberationSans-Regular.ttf`

- Χρησιμοποιείται στα PDF exports.
- Επιτρέπει σωστή εμφάνιση ελληνικών χαρακτήρων στα PDF.

#### `public/icons.svg` και `public/favicon.svg`

- Περιέχουν εικονίδια και favicon της εφαρμογής.

#### `src/assets/hero.png`

- Εικόνα asset που μπορεί να χρησιμοποιείται σε auth ή visual sections.

## Testing

#### `src/test/java/com/thesis/agrimanager/AgriManagerApplicationTests.java`

- Ελέγχει ότι το Spring context φορτώνει σωστά.

#### `service/TaskServiceTest.java`

- Ελέγχει τη λογική προόδου εργασιών.
- Ελέγχει ότι η ολοκλήρωση συγκομιδής αυξάνει την παραγωγή μόνο μία φορά.
- Ελέγχει ότι συγκομιδή χωρίς ποσότητα απορρίπτεται.
- Ελέγχει ότι συγκομιδή χωρίς τιμή πώλησης απορρίπτεται.
- Ελέγχει ότι η διαγραφή ολοκληρωμένης συγκομιδής διατηρεί παραγωγή και τιμή.
- Ελέγχει ότι χρήστης δεν μπορεί να δημιουργήσει εργασία σε καλλιέργεια άλλου farmer.
- Ελέγχει ότι το κόστος υπολογίζεται από κόστος ανά ώρα και ώρες εργασίας.

#### `service/CropServiceTest.java`

- Ελέγχει ότι η δημιουργία καλλιέργειας χωρίς τιμή πώλησης απορρίπτεται.
- Ελέγχει ότι η ενημέρωση καλλιέργειας με μη θετική τιμή πώλησης απορρίπτεται.

#### `service/UserProfitServiceTest.java`

- Ελέγχει αρχικοποίηση οικονομικών περιόδων.
- Ελέγχει καταγραφή εσόδων και εξόδων.
- Ελέγχει ότι οι διαγραφές εργασιών δεν αλλάζουν οικονομικά ιστορικά στοιχεία.
- Ελέγχει reset όταν αλλάζει μήνας ή εξάμηνο.
- Ελέγχει reset συγκεκριμένων οικονομικών πεδίων ή όλων μαζί.

#### `service/StatsServiceTest.java`

- Ελέγχει επιστροφή αποθηκευμένων οικονομικών στοιχείων farmer.
- Ελέγχει reset οικονομικών στατιστικών.

#### `service/AdminAnalyticsServiceTest.java`

- Ελέγχει συνολικά admin analytics.
- Ελέγχει μηνιαία έσοδα και έξοδα.
- Ελέγχει ότι τα global KPIs περιλαμβάνουν σωστά farmer δεδομένα.
- Ελέγχει analytics για συγκεκριμένο farmer.
- Ελέγχει χρήση οικονομικού snapshot και financial records.

#### `service/AiAssistantServiceTest.java`

- Ελέγχει ότι απορρίπτεται request χωρίς Groq API key.
- Ελέγχει ότι δημιουργείται σωστό Groq chat completion request.
- Ελέγχει ότι επιστρέφεται το assistant content.
- Ελέγχει επιλογή αγγλικής οδηγίας όταν ο χρήστης γράφει στα αγγλικά.

#### `controller/AiAssistantControllerTest.java`

- Ελέγχει ότι το AI prompt χτίζεται από τα χωράφια και τις καλλιέργειες του authenticated farmer.
- Ελέγχει ότι το prompt περιέχει στοιχεία όπως όνομα χωραφιού, τύπο εδάφους, ποικιλία και ημερομηνία φύτευσης.

#### `controller/StatsControllerTest.java`

- Ελέγχει ότι το reset οικονομικών δεδομένων γίνεται για τον authenticated user.

## Κύρια Ροή Δεδομένων

- Ο χρήστης κάνει login από το React frontend.
- Το backend επιστρέφει JWT token.
- Το Axios instance αποθηκεύει και στέλνει το token σε κάθε προστατευμένο request.
- Ο χρήστης δημιουργεί χωράφι σχεδιάζοντας polygon στον χάρτη.
- Το frontend υπολογίζει έκταση με Turf και ελέγχει χρήση γης με Overpass.
- Το backend αποθηκεύει το polygon σε PostgreSQL/PostGIS.
- Ο χρήστης δημιουργεί καλλιέργεια μέσα στο χωράφι.
- Το backend ελέγχει χωρικά ότι η καλλιέργεια βρίσκεται μέσα στο χωράφι.
- Ο χρήστης δημιουργεί εργασία πάνω σε καλλιέργεια.
- Το backend ελέγχει ownership και χωρική εγκυρότητα σημείου εργασίας.
- Όταν ολοκληρώνεται συγκομιδή, ενημερώνονται παραγωγή, έσοδα και οικονομικά records.
- Τα dashboards και analytics διαβάζουν τα δεδομένα και τα εμφανίζουν με κάρτες, πίνακες και γραφήματα.
- Ο admin μπορεί να δει συνολικά στοιχεία και να διαχειριστεί farmers.

## Σημαντικά Τεχνικά Χαρακτηριστικά

- Role based access control με `ROLE_USER` και `ROLE_ADMIN`.
- JWT stateless authentication.
- PostgreSQL/PostGIS για πραγματικά γεωχωρικά δεδομένα.
- JTS geometry objects σε Java.
- Leaflet/Geoman/Turf για γεωγραφική αλληλεπίδραση στο frontend.
- OpenWeather integration για καιρικά δεδομένα ανά χωράφι.
- Overpass API integration για έλεγχο χρήσης γης.
- Groq AI integration για γεωπονικό assistant.
- PDF exports με ελληνική γραμματοσειρά.
- Οικονομικό ιστορικό που δεν χάνεται όταν διαγράφονται operational δεδομένα.
- Unit tests για κρίσιμη επιχειρησιακή λογική.
