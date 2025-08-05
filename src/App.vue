<template>
  <div id="app">
    <div class="tab-container">
      <div class="tab-header">
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'player' }"
          @click="setActiveTab('player')"
        >
          Gracz
        </button>
        <button 
          v-if="hasBeenAdmin && o2Choice !== 'second'"
          class="tab-button"
          :class="{ active: activeTab === 'main' }"
          @click="setActiveTab('main')"
        >
          Panel główny
        </button>
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'admin' }"
          @click="setActiveTab('admin')"
        >
          Admin
        </button>
        <button 
          v-if="hasBeenAdmin && o2Choice !== 'second'"
          class="tab-button"
          :class="{ active: activeTab === 'o2-first' }"
          @click="setActiveTab('o2-first')"
        >
          Pierwsze O2
        </button>
        <button 
          v-if="hasBeenAdmin && o2Choice !== 'first'"
          class="tab-button"
          :class="{ active: activeTab === 'o2-second' }"
          @click="setActiveTab('o2-second')"
        >
          Drugie O2
        </button>
      </div>
      
      <div class="tab-content">
        <div v-if="activeTab === 'player'" class="tab-panel">
          <h2>Gracz</h2>
          
          <!-- Oxygen Alert -->
          <div v-if="shouldShowOxygenAlert" class="oxygen-alert">
            <div class="alert-header">
              <span class="alert-icon">⚠️</span>
              <h3>ALARM TLENOWY</h3>
            </div>
            <p class="alert-message">
              Uwaga! Utrata tlenu, wymagana interwencja w maszynowniach!
            </p>
            
            <!-- Oxygen Countdown Timer -->
            <div v-if="oxygenTimeLeft" class="oxygen-countdown">
              <div class="countdown-header">
                <span class="countdown-icon">⏰</span>
                <span class="countdown-label">Pozostały czas:</span>
              </div>
              <div class="countdown-time">
                {{ oxygenTimeLeft.minutes.toString().padStart(2, '0') }}:{{ oxygenTimeLeft.seconds.toString().padStart(2, '0') }}
              </div>
            </div>
          </div>
          
          <!-- Formularz rejestracji gracza (tylko gdy gra nieaktywna) -->
          <div v-if="!gameState.isGameActive && !shouldShowOxygenAlert" class="player-registration">
            <div v-if="!isPlayerRegistered" class="registration-form">
              <h3>Dołącz do gry</h3>
              <p>Wprowadź swoją nazwę gracza, aby dołączyć do gry:</p>
              
              <div class="form-group">
                <input 
                  v-model="playerName"
                  type="text"
                  placeholder="Nazwa gracza"
                  class="player-name-input"
                  :disabled="playerRegistrationLoading"
                  @keyup.enter="registerPlayer"
                  maxlength="20"
                />
                <button 
                  @click="registerPlayer"
                  :disabled="playerRegistrationLoading || !playerName.trim()"
                  class="btn-register"
                >
                  {{ playerRegistrationLoading ? 'Rejestrowanie...' : 'Dołącz do gry' }}
                </button>
              </div>
            </div>
            
            <div v-else class="player-status">
              <h3>Zarejestrowany jako: {{ registeredPlayerName }}</h3>
              <p>Oczekiwanie na rozpoczęcie gry...</p>
            </div>
          </div>
          
          <!-- Gra aktywna - logowanie lub widok gry -->
          <div v-else-if="!shouldShowOxygenAlert" class="game-active-section">
            <!-- Widok gry po zalogowaniu -->
            <div v-if="showGameView" class="game-view" :class="{ 'player-dead': isPlayerDead }">
              <h3>Widok gry</h3>
              <div class="game-interface">
                <div class="player-info-section">
                  <p><strong>Grasz jako:</strong> {{ registeredPlayerName }}</p>
                  <button class="role-info-btn" @click="forceRoleShow" title="Pokaż informacje o roli">
                    <span class="role-btn-text">Pokaż rolę</span>
                  </button>
                </div>
                
                <!-- Blackmail warning -->
                <div v-if="isCurrentPlayerBlackmailed" class="blackmail-warning">
                  <p class="blackmail-alert">⚠️ Zostałeś szantażowany! Nie możesz głosować na kolejnym spotkaniu.</p>
                </div>
                
                <!-- Game Action Buttons -->
                <div class="game-actions">
                  <div class="action-buttons">
                    <button class="action-btn" @click="openSabotageModal" :disabled="!isLoggedInToGame || isPlayerDead">
                      <img src="../images/icon-o2.png" alt="O2" class="btn-icon-img">
                    </button>
                    <button class="action-btn" @click="openBlackmailModal" :disabled="!isLoggedInToGame || isPlayerDead">
                      <img src="../images/icon-blackmail.png" alt="Blackmail" class="btn-icon-img">
                    </button>
                    <button class="action-btn" @click="showReportConfirm" :disabled="!isLoggedInToGame || isPlayerDead">
                      <img src="../images/icon-report.png" alt="Report" class="btn-icon-img">
                    </button>
                    <button class="action-btn" @click="showKillConfirm" :disabled="!isLoggedInToGame">
                      <img src="../images/icon-kill.png" alt="Kill" class="btn-icon-img">
                    </button>
                    <button class="action-btn" @click="openMapModal" :disabled="!isLoggedInToGame">
                      <img src="../images/icon-map.png" alt="Map" class="btn-icon-img">
                    </button>
                  </div>
                </div>
                
                <!-- Player Tasks List -->
                <div class="player-tasks">
                  <h4>Twoje zadania</h4>
                  
                  <!-- Tasks Progress Bar -->
                  <div v-if="gameState.tasksToComplete && gameState.tasksToComplete > 0" class="tasks-progress">
                    <div class="progress-info">
                      <span class="progress-label">
                        🎯 Postęp zadań:
                      </span>
                      <span class="progress-percentage">
                        {{ Math.round(((gameState.completedTasks || 0) / gameState.tasksToComplete) * 100) }}%
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ 
                          width: ((gameState.completedTasks || 0) / gameState.tasksToComplete) * 100 + '%' 
                        }"
                      ></div>
                    </div>
                  </div>
                  
                  <div v-if="playerTasksLoading" class="tasks-loading">
                    <p>⏳ Ładowanie zadań...</p>
                  </div>
                  
                  <div v-else-if="!playerTasks || playerTasks.length === 0" class="no-tasks">
                    <p>🎯 Brak przypisanych zadań</p>
                  </div>
                  
                  <div v-else class="tasks-list">
                    <div 
                      v-for="task in playerTasks" 
                      :key="task.id"
                      class="task-bar"
                      :class="{ 
                        'completed': task.isCompleted
                      }"
                      @click="showTaskDetails(task)"
                    >
                      <!-- Complete Task Button -->
                      <button 
                        v-if="!task.isCompleted"
                        @click.stop="completeTask(task.id)"
                        class="task-complete-btn"
                        title="Zakończ zadanie"
                        :disabled="taskCompletionLoading"
                      >
                        {{ taskCompletionLoading ? '⏳' : '✓' }}
                      </button>
                      <!-- Task Bar -->
                      <div class="task-bar-content">
                        
                        <!-- Task Info -->
                        <div class="task-info">
                          <span class="task-title">{{ task.name }}</span>
                          <span class="task-location">📍 {{ task.location }}</span>
                        </div>
                        
                        <!-- Status -->
                        <div class="task-actions">
                          <span class="task-status">{{ task.isCompleted ? '✅' : '📋' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button @click="loadPlayerTasks" class="btn btn-info tasks-refresh" :disabled="playerTasksLoading">
                    {{ playerTasksLoading ? 'Odświeżanie...' : '🔄 Odśwież zadania' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Formularz logowania do aktywnej gry -->
            <div v-else class="game-login">
              <h3>Zaloguj się do gry</h3>
              <p>Gra jest w toku. Wprowadź swoją nazwę gracza, aby się zalogować:</p>
              
              <div class="form-group">
                <input 
                  v-model="playerName"
                  type="text"
                  placeholder="Nazwa gracza"
                  class="player-name-input"
                  :disabled="playerRegistrationLoading"
                  @keyup.enter="loginToGame"
                  maxlength="20"
                />
                <button 
                  @click="loginToGame"
                  :disabled="playerRegistrationLoading || !playerName.trim()"
                  class="btn-login"
                >
                  {{ playerRegistrationLoading ? 'Logowanie...' : 'Zaloguj się do gry' }}
                </button>
              </div>
              
              <div class="game-login-info">
                <p>💡 <strong>Uwaga:</strong> Możesz się zalogować tylko jeśli twoje konto istnieje w aktywnej grze.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'main'" class="tab-panel">
          <h2>Panel główny</h2>
          
          <!-- Oxygen Alert -->
          <div v-if="shouldShowOxygenAlert" class="oxygen-alert">
            <div class="alert-header">
              <span class="alert-icon">⚠️</span>
              <h3>ALARM TLENOWY</h3>
            </div>
            <p class="alert-message">
              Uwaga! Utrata tlenu, wymagana interwencja w maszynowniach!
            </p>
            
            <!-- Oxygen Countdown Timer -->
            <div v-if="oxygenTimeLeft" class="oxygen-countdown">
              <div class="countdown-header">
                <span class="countdown-icon">⏰</span>
                <span class="countdown-label">Pozostały czas:</span>
              </div>
              <div class="countdown-time">
                {{ oxygenTimeLeft.minutes.toString().padStart(2, '0') }}:{{ oxygenTimeLeft.seconds.toString().padStart(2, '0') }}
              </div>
            </div>
          </div>
          
          <!-- PANIC Button Section -->
          <div v-if="!shouldShowOxygenAlert" class="panic-section">
            <div class="panic-container">
              <button class="main-panel-map" @click="openMapModal">
                <img src="../images/icon-map.png" alt="Map" class="btn-icon-img">
              </button>

              <button 
                v-if="!gameState.isPanic && !gameState.isCorpse"
                @click="showPanicDialog" 
                class="btn-panic"
                :disabled="loading"
              >
                <div v-if="panicCooldownTimeLeft" class="panic-cooldown-timer">
                  <div class="cooldown-header">
                    <span class="cooldown-icon">⏰</span>
                    <span class="cooldown-label">Cooldown Paniki:</span>
                  </div>
                  <div class="cooldown-time">
                    {{ panicCooldownTimeLeft.minutes.toString().padStart(2, '0') }}:{{ panicCooldownTimeLeft.seconds.toString().padStart(2, '0') }}
                  </div>
                </div>
                <div v-else>
                  🚨 PANIC 🚨
                </div>
              </button>
              <button 
                v-else
                @click="endPanic" 
                class="btn-end-meeting"
                :disabled="loading"
                >
                🏁 Zakończ spotkanie
              </button>
            </div>
            
            <!-- Blackmail info during meeting -->
            <div v-if="(gameState.isPanic || gameState.isCorpse) && blackmailedPlayer" class="blackmail-info">
              <p class="blackmail-text">⚠️ Gracz {{ blackmailedPlayer.name }} został zaszantażowany</p>
            </div>
          </div>

          <!-- Panic Dialog -->
          <div v-if="showPanicModal" class="modal-overlay" @click="closePanicDialog">
            <div class="modal-content" @click.stop>
              <div class="modal-header">
                <h3>Wybierz gracza do zgłoszenia paniki</h3>
                <button @click="closePanicDialog" class="close-btn">&times;</button>
              </div>
              
              <div class="modal-body">
                <div v-if="loadingPlayers" class="loading-text">
                  Ładowanie graczy...
                </div>
                
                <div v-else-if="!alivePlayers || alivePlayers.length === 0" class="no-players">
                  Brak żywych graczy
                </div>
                
                <div v-else class="players-grid">
                  <button 
                    v-for="player in alivePlayers" 
                    :key="player.id"
                    @click="startPanic(player.name)"
                    class="player-panic-btn"
                    :disabled="loading"
                  >
                    {{ player.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- VITALS Section -->
          <div v-if="!shouldShowOxygenAlert" class="vitals-section">
            <div class="vitals-header">
              <h3>🏥 VITALS - Monitor Życia</h3>
              <div class="vitals-status">
                <span class="status-indicator online"></span>
                <span class="status-text">System Aktywny</span>
              </div>
            </div>
            
            <div class="vitals-container">
              <div v-if="gameState.playersInfo && gameState.playersInfo.length > 0" class="vitals-grid">
                <div 
                  v-for="player in gameState.playersInfo" 
                  :key="player.name"
                  class="vitals-card"
                  :class="{ 'deceased': !player.isAlive }"
                >
                  <div class="vitals-header-card">
                    <div class="patient-id">ID: {{ player.name.substring(0, 3).toUpperCase() }}</div>
                    <div class="vital-status" :class="{ 'alive': player.isAlive, 'dead': !player.isAlive }">
                      {{ player.isAlive ? '✚ ŻYWY' : '✖ ZMARŁY' }}
                    </div>
                  </div>
                  
                  <div class="patient-info">
                    <div class="patient-name">{{ player.name }}</div>
                    <div class="vital-signs">
                      <div class="vital-line">
                        <span class="vital-label">Puls:</span>
                        <span class="vital-value" :class="{ 'flatline': !player.isAlive }">
                          {{ player.isAlive ? '♥ 72 BPM' : '— — — 0 BPM' }}
                        </span>
                      </div>
                      <div class="vital-line">
                        <span class="vital-label">Status:</span>
                        <span class="vital-value" :class="{ 'critical': !player.isAlive }">
                          {{ player.isAlive ? 'STABILNY' : 'KRYTYCZNY' }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="vitals-chart">
                    <div class="ecg-line" :class="{ 'flatline': !player.isAlive }"></div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-vitals">
                <div class="no-vitals-content">
                  <div class="medical-cross">✚</div>
                  <p>Brak danych pacjentów</p>
                  <small>Oczekiwanie na połączenie z systemem medycznym...</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'admin'" class="tab-panel">
          <h2>Admin Panel</h2>
          
          <!-- Login Section -->
          <div v-if="!isLoggedIn" class="login-section">
            <h3>Logowanie</h3>
            <form @submit.prevent="login" class="login-form">
              <div class="form-group">
                <label>Nazwa użytkownika:</label>
                <input v-model="loginData.username" type="text" required />
              </div>
              <div class="form-group">
                <label>Hasło:</label>
                <input v-model="loginData.password" type="password" required />
              </div>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Logowanie...' : 'Zaloguj' }}
              </button>
            </form>
            <div v-if="loginError" class="error">{{ loginError }}</div>
          </div>

          <!-- Admin Content -->
          <div v-else class="admin-content">
            <div class="admin-header">
              <span>Zalogowany jako admin</span>
              <button @click="logout" class="btn btn-secondary">Wyloguj</button>
            </div>

            <!-- Settings Section -->
            <div class="section">
              <h3>Ustawienia Gry</h3>
              <button @click="loadSettings" class="btn btn-info" :disabled="loading">
                {{ loading ? 'Ładowanie...' : 'Odśwież ustawienia' }}
              </button>
              
              <form v-if="settings" @submit.prevent="saveSettings" class="settings-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Zadania na gracza:</label>
                    <input v-model.number="settings.taskPerPlayer" type="number" min="1" required />
                  </div>
                  <div class="form-group">
                    <label>Czas sabotażu (min):</label>
                    <input v-model.number="settings.sabotageDeadlineFromMinutes" type="number" min="1" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Liczba impostorów:</label>
                    <input v-model.number="settings.impostorsAmount" type="number" min="0" required />
                  </div>
                  <div class="form-group">
                    <label>Liczba detektywów:</label>
                    <input v-model.number="settings.detectivesAmount" type="number" min="0" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Liczba doktorów:</label>
                    <input v-model.number="settings.doctorsAmount" type="number" min="0" required />
                  </div>
                  <div class="form-group">
                    <label>Cooldown paniki (min):</label>
                    <input v-model.number="settings.panicCooldownFromMinutes" type="number" min="1" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Cooldown sabotażu (min):</label>
                    <input v-model.number="settings.sabotageCooldownFromMinutes" type="number" min="1" required />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  {{ loading ? 'Zapisywanie...' : 'Zapisz ustawienia' }}
                </button>
              </form>
            </div>

            <!-- Game Control Section -->
            <div class="section">
              <h3>Kontrola Gry</h3>
              
              <!-- Game Status Indicator -->
              <div class="game-status-indicator">
                <div class="status-badge" :class="{ 'active': gameState.isGameActive, 'inactive': !gameState.isGameActive }">
                  <span class="status-icon">{{ gameState.isGameActive ? '🟢' : '🔴' }}</span>
                  <span class="status-text">
                    {{ gameState.isGameActive ? 'GRA AKTYWNA' : 'GRA NIEAKTYWNA' }}
                  </span>
                </div>
              </div>
              
              <div class="game-controls">
                <button @click="startGame" class="btn btn-success" :disabled="loading">
                  {{ loading ? 'Uruchamianie...' : 'Rozpocznij grę' }}
                </button>
                <button @click="stopGame" class="btn btn-danger" :disabled="loading">
                  {{ loading ? 'Zatrzymywanie...' : 'Zatrzymaj grę' }}
                </button>
              </div>
            </div>

            <!-- Players Section -->
            <div class="section">
              <h3>Gracze</h3>
              <div class="players-controls">
                <button @click="loadPlayers" class="btn btn-info" :disabled="loading">
                  {{ loading ? 'Ładowanie...' : 'Odśwież listę graczy' }}
                </button>
                <button @click="resetPlayers" class="btn btn-warning" :disabled="loading">
                  {{ loading ? 'Resetowanie...' : 'Resetuj graczy' }}
                </button>
                <button @click="togglePlayerRoles" class="btn btn-secondary">
                  {{ showPlayerRoles ? '🙈 Ukryj role' : '👁️ Pokaż role' }}
                </button>
              </div>
              
              <div v-if="players && players.length > 0" class="players-list">
                <div v-for="player in players" :key="player.id" class="player-item">
                  <span class="player-name">{{ player.name }}</span>
                  <span v-if="showPlayerRoles" class="player-role">{{ player.role || 'Brak roli' }}</span>
                  <span v-else class="player-role-hidden">Rola ukryta</span>
                </div>
              </div>
              <div v-else-if="playersLoaded" class="no-data">
                Brak graczy w bazie danych
              </div>
            </div>

            <!-- Tasks Section -->
            <div class="section">
              <h3>Zadania</h3>
              <div class="tasks-controls">
                <button @click="loadTasks" class="btn btn-info" :disabled="loading">
                  {{ loading ? 'Ładowanie...' : 'Odśwież zadania' }} {{'[' + tasks.length + ']'}}
                </button>
              </div>

              <!-- Add Task Form -->
              <form @submit.prevent="createTask" class="task-form">
                <h4>Dodaj nowe zadanie</h4>
                <div class="form-group">
                  <label>Nazwa zadania:</label>
                  <input v-model="newTask.name" type="text" required />
                </div>
                <div class="form-group">
                  <label>Lokalizacja:</label>
                  <input v-model="newTask.location" type="text" required />
                </div>
                <div class="form-group">
                  <label>Opis:</label>
                  <textarea v-model="newTask.description" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  {{ loading ? 'Dodawanie...' : 'Dodaj zadanie' }}
                </button>
              </form>

              <!-- Tasks List -->
              <div v-if="tasks && tasks.length > 0" class="tasks-list">
                <div v-for="task in tasks" :key="task.id" class="task-item">
                  <div class="task-info">
                    <h5>{{ task.name }}</h5>
                    <p class="task-location">Lokalizacja: {{ task.location }}</p>
                    <p class="task-description">{{ task.description }}</p>
                  </div>
                  <button @click="deleteTask(task.id)" class="btn btn-danger btn-small" :disabled="loading">
                    Usuń
                  </button>
                </div>
              </div>
              <div v-else-if="tasksLoaded" class="no-data">
                Brak zadań w bazie danych
              </div>
            </div>

            <!-- O2 System Management -->
            <div class="settings-section">
              <h3>Zarządzanie systemami O2</h3>
              <div class="o2-management">
                <div class="o2-status">
                  <p><strong>Status:</strong> 
                    <span v-if="!hasBeenAdmin" class="status-inactive">Systemy O2 nieaktywne</span>
                    <span v-else-if="o2Choice === 'none'" class="status-ready">Gotowe do wyboru systemu</span>
                    <span v-else-if="o2Choice === 'first'" class="status-first">Wybrano Pierwsze O2</span>
                    <span v-else-if="o2Choice === 'second'" class="status-second">Wybrano Drugie O2</span>
                  </p>
                  
                  <p v-if="hasBeenAdmin">
                    <strong>Dostępne zakładki:</strong>
                    <span v-if="o2Choice !== 'second'" class="tab-available">"Pierwsze O2"</span>
                    <span v-if="o2Choice !== 'first'" class="tab-available">"Drugie O2"</span>
                    <span v-if="o2Choice !== 'none'" class="tab-locked">
                      (Druga opcja zablokowana po wyborze)
                    </span>
                  </p>
                </div>
                
                <button 
                  @click="clearO2Data" 
                  class="btn btn-danger btn-o2-clear"
                  :disabled="loading"
                >
                  🗑️ Wyczyść dane systemów O2
                </button>
                
                <div class="o2-warning">
                  <p><strong>⚠️ Uwaga:</strong> Wyczyszczenie danych spowoduje:</p>
                  <ul>
                    <li>Ukrycie zakładek "Pierwsze O2" i "Drugie O2"</li>
                    <li>Zresetowanie wyborów wszystkich użytkowników</li>
                    <li>Zakładki pojawią się ponownie po pierwszym zalogowaniu jako admin</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Messages -->
            <div v-if="message" class="message" :class="messageType">
              {{ message }}
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'o2-first'" class="tab-panel">
          <h2>Pierwsze O2</h2>
          
          <!-- Oxygen Alert -->
          <div v-if="shouldShowOxygenAlert" class="oxygen-alert">
            <div class="alert-header">
              <span class="alert-icon">⚠️</span>
              <h3>ALARM TLENOWY</h3>
            </div>
            <p class="alert-message">
              Uwaga! Utrata tlenu, wymagana interwencja w maszynowniach!
            </p>
            
            <!-- Oxygen Countdown Timer -->
            <div v-if="oxygenTimeLeft" class="oxygen-countdown">
              <div class="countdown-header">
                <span class="countdown-icon">⏰</span>
                <span class="countdown-label">Pozostały czas:</span>
              </div>
              <div class="countdown-time">
                {{ oxygenTimeLeft.minutes.toString().padStart(2, '0') }}:{{ oxygenTimeLeft.seconds.toString().padStart(2, '0') }}
              </div>
            </div>
          </div>
          
          <!-- Oxygen Controls -->
          <div class="oxygen-controls">
            <button 
              class="btn-restore-oxygen" 
              :disabled="!shouldShowOxygenAlert"
              :class="{ 'inactive': !shouldShowOxygenAlert }"
              @mousedown="pressFirstO2"
              @mouseup="releaseFirstO2"
              @mouseleave="releaseFirstO2"
              @touchstart="pressFirstO2"
              @touchend="releaseFirstO2"
            >
              🔧 Przywróć tlen
            </button>
            
            <div v-if="!shouldShowOxygenAlert" class="oxygen-status-normal">
              <span class="status-icon">✅</span>
              <span>System tlenowy działa prawidłowo</span>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'o2-second'" class="tab-panel">
          <h2>Drugie O2</h2>
          
          <!-- Oxygen Alert -->
          <div v-if="shouldShowOxygenAlert" class="oxygen-alert">
            <div class="alert-header">
              <span class="alert-icon">⚠️</span>
              <h3>ALARM TLENOWY</h3>
            </div>
            <p class="alert-message">
              Uwaga! Utrata tlenu, wymagana interwencja w maszynowniach!
            </p>
            
            <!-- Oxygen Countdown Timer -->
            <div v-if="oxygenTimeLeft" class="oxygen-countdown">
              <div class="countdown-header">
                <span class="countdown-icon">⏰</span>
                <span class="countdown-label">Pozostały czas:</span>
              </div>
              <div class="countdown-time">
                {{ oxygenTimeLeft.minutes.toString().padStart(2, '0') }}:{{ oxygenTimeLeft.seconds.toString().padStart(2, '0') }}
              </div>
            </div>
          </div>
          
          <!-- Oxygen Controls -->
          <div class="oxygen-controls">
            <button 
              class="btn-restore-oxygen" 
              :disabled="!shouldShowOxygenAlert"
              :class="{ 'inactive': !shouldShowOxygenAlert }"
              @mousedown="pressSecondO2"
              @mouseup="releaseSecondO2"
              @mouseleave="releaseSecondO2"
              @touchstart="pressSecondO2"
              @touchend="releaseSecondO2"
            >
              🔧 Przywróć tlen
            </button>
            
            <div v-if="!shouldShowOxygenAlert" class="oxygen-status-normal">
              <span class="status-icon">✅</span>
              <span>System tlenowy działa prawidłowo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal z informacją o zwycięstwie -->
    <div v-if="showVictoryModal" class="victory-modal-overlay" @click="closeVictoryModal">
      <div class="victory-modal" @click.stop>
        <div class="victory-modal-header">
          <h2>🎉 Gra zakończona!</h2>
          <button class="victory-modal-close" @click="closeVictoryModal">×</button>
        </div>
        <div class="victory-modal-content">
          <div class="victory-icon">🏆</div>
          <h3>Zwyciężyła drużyna:</h3>
          <div class="winning-team">{{ gameState.winningTeam }}</div>
          
          <!-- Informacje o impostorach -->
          <div v-if="gameState.impostorsNames && gameState.impostorsNames.trim() !== ''" class="impostors-section">
            <h4>👥 Drużyna Impostorów:</h4>
            <div class="impostors-list">{{ gameState.impostorsNames }}</div>
          </div>
        </div>
        <div class="victory-modal-footer">
          <button class="btn btn-primary" @click="closeVictoryModal">Zamknij</button>
        </div>
      </div>
    </div>
    
    <!-- Modal potwierdzenia zabicia -->
    <div v-if="showKillConfirmModal" class="kill-confirm-modal-overlay" @click="closeKillConfirmModal">
      <div class="kill-confirm-modal" @click.stop>
        <div class="kill-confirm-modal-header">
          <h2>⚠️ Potwierdzenie akcji</h2>
          <button class="kill-confirm-modal-close" @click="closeKillConfirmModal">×</button>
        </div>
        <div class="kill-confirm-modal-content">
          <div class="kill-icon">💀</div>
          <h3>Czy na pewno chcesz użyć akcji "Kill"?</h3>
        </div>
        <div class="kill-confirm-modal-footer">
          <button class="btn btn-secondary" @click="closeKillConfirmModal">Anuluj</button>
          <button class="btn btn-danger" @click="confirmKill" :disabled="killLoading">
            {{ killLoading ? 'Wykonywanie...' : 'Potwierdź' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal potwierdzenia zgłoszenia -->
    <div v-if="showReportConfirmModal" class="report-confirm-modal-overlay" @click="closeReportConfirmModal">
      <div class="report-confirm-modal" @click.stop>
        <div class="report-confirm-modal-header">
          <h2>⚠️ Potwierdzenie akcji</h2>
          <button class="report-confirm-modal-close" @click="closeReportConfirmModal">×</button>
        </div>
        <div class="report-confirm-modal-content">
          <div class="report-icon">🚨</div>
          <h3>Czy na pewno chcesz zgłosić martwe ciało?</h3>
        </div>
        <div class="report-confirm-modal-footer">
          <button class="btn btn-secondary" @click="closeReportConfirmModal">Anuluj</button>
          <button class="btn btn-warning" @click="confirmReport" :disabled="reportLoading">
            {{ reportLoading ? 'Zgłaszanie...' : 'Zgłoś' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal informacyjny o panice/martwym ciele -->
    <div v-if="showEmergencyModal" class="emergency-modal-overlay">
      <div class="emergency-modal">
        <div class="emergency-modal-header">
          <h2 v-if="gameState.isPanic">🚨 PANIC</h2>
          <h2 v-else-if="gameState.isCorpse">💀 MARTWE CIAŁO</h2>
        </div>
        <div class="emergency-modal-content">
          <div class="emergency-icon">
            <span v-if="gameState.isPanic">🚨</span>
            <span v-else-if="gameState.isCorpse">💀</span>
          </div>
          <h3>Udać się na spotkanie!</h3>
          <div class="emergency-info">
            <p v-if="gameState.isPanic && gameState.panicReporter">
              <strong>Zgłosił panikę:</strong> {{ gameState.panicReporter }}
            </p>
            <p v-else-if="gameState.isCorpse && gameState.corpseReporter">
              <strong>Zgłosił martwe ciało:</strong> {{ gameState.corpseReporter }}
            </p>
          </div>
          <p class="emergency-message">Wszyscy gracze muszą udać się na spotkanie!</p>
        </div>
      </div>
    </div>
    
    <!-- Modal z mapami -->
    <div v-if="showMapModal" class="map-modal-overlay" @click="closeMapModal">
      <div class="map-modal" @click.stop>
        <div class="map-modal-header">
          <h2>🗺️ Mapa</h2>
          <button class="map-modal-close" @click="closeMapModal">×</button>
        </div>
        <div class="map-modal-content">
          <!-- Zakładki map -->
          <div class="map-tabs">
            <button 
              class="map-tab"
              :class="{ active: activeMapTab === 'out' }"
              @click="setActiveMapTab('out')"
            >
              🏡 Dwór
            </button>
            <button 
              class="map-tab"
              :class="{ active: activeMapTab === 'in' }"
              @click="setActiveMapTab('in')"
            >
              🏠 Domek
            </button>
            <button 
              class="map-tab"
              :class="{ active: activeMapTab === 'up' }"
              @click="setActiveMapTab('up')"
            >
              ⛰️ Góra
            </button>
          </div>
          
          <!-- Zawartość map -->
          <div class="map-content">
            <div v-if="activeMapTab === 'out'" class="map-image-container">
              <img src="../images/map-out.png" alt="Mapa - Dwór" class="map-image">
            </div>
            <div v-else-if="activeMapTab === 'in'" class="map-image-container">
              <img src="../images/map-in.png" alt="Mapa - Domek" class="map-image">
            </div>
            <div v-else-if="activeMapTab === 'up'" class="map-image-container">
              <img src="../images/map-up.png" alt="Mapa - Góra" class="map-image">
            </div>
          </div>
        </div>
        <div class="map-modal-footer">
          <button class="btn btn-primary" @click="closeMapModal">Zamknij</button>
        </div>
      </div>
    </div>
    
    <!-- Modal ze szczegółami zadania -->
    <div v-if="showTaskDetailsModal" class="task-details-modal-overlay" @click="closeTaskDetailsModal">
      <div class="task-details-modal" @click.stop>
        <div class="task-details-modal-header">
          <h2>📋 Szczegóły zadania</h2>
          <button class="task-details-modal-close" @click="closeTaskDetailsModal">×</button>
        </div>
        <div class="task-details-modal-content">
          <div class="task-details-info">
            <h3>{{ selectedTask?.name || 'Brak nazwy' }}</h3>
            
            <div class="task-description">
              <p>{{ selectedTask?.description || 'Brak opisu' }}</p>
            </div>
          </div>
        </div>
          <div class="task-details-modal-footer">
            <button class="btn btn-primary" @click="closeTaskDetailsModal">Zamknij</button>
          </div>
      </div>
    </div>
    
    <!-- Modal blackmail -->
    <div v-if="showBlackmailModal" class="blackmail-modal-overlay" @click="closeBlackmailModal">
      <div class="blackmail-modal" @click.stop>
        <div class="blackmail-modal-header">
          <h2>💰 Szantaż</h2>
          <button class="blackmail-modal-close" @click="closeBlackmailModal">×</button>
        </div>
        <div class="blackmail-modal-content">
          <div v-if="blackmailLoading" class="blackmail-loading">
            <p>⏳ Ładowanie graczy...</p>
          </div>
          <div v-else-if="!blackmailPlayers || blackmailPlayers.length === 0" class="no-blackmail-players">
            <p>❌ Brak graczy do szantażowania</p>
          </div>
          <div v-else class="blackmail-players-list">
            <h3>Wybierz gracza do szantażowania:</h3>
            <div class="blackmail-player-item" 
                 v-for="player in blackmailPlayers" 
                 :key="player.id"
                 @click="selectBlackmailPlayer(player)"
                 :class="{ 'selected': selectedBlackmailPlayer?.id === player.id }"
            >
              <div class="player-info">
                <span class="player-name">{{ player.name }}</span>
                <span class="player-status" :class="{ 'alive': player.isAlive, 'dead': !player.isAlive }">
                  {{ player.isAlive ? '🟢 Żywy' : '🔴 Martwy' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="blackmail-modal-footer">
          <button class="btn btn-primary" @click="closeBlackmailModal">Anuluj</button>
        </div>
      </div>
    </div>
    
    <!-- Modal sabotażu -->
    <div v-if="showSabotageModal" class="sabotage-modal-overlay" @click="closeSabotageModal">
      <div class="sabotage-modal" @click.stop>
        <div class="sabotage-modal-header">
          <h2>💀 Sabotaż O2</h2>
          <button class="sabotage-modal-close" @click="closeSabotageModal">×</button>
        </div>
        <div class="sabotage-modal-content">
          <div class="sabotage-icon">💀</div>
          <h3>Wybierz opóźnienie sabotażu:</h3>
          <div class="sabotage-options">
            <button 
              class="sabotage-option"
              @click="executeSabotage(0)"
              :disabled="sabotageLoading"
            >
              <span class="option-icon">⚡</span>
              <span class="option-text">Natychmiast</span>
            </button>
            <button 
              class="sabotage-option"
              @click="executeSabotage(1)"
              :disabled="sabotageLoading"
            >
              <span class="option-icon">⏱️</span>
              <span class="option-text">1 min</span>
            </button>
            <button 
              class="sabotage-option"
              @click="executeSabotage(3)"
              :disabled="sabotageLoading"
            >
              <span class="option-icon">⏰</span>
              <span class="option-text">3 min</span>
            </button>
            <button 
              class="sabotage-option"
              @click="executeSabotage(5)"
              :disabled="sabotageLoading"
            >
              <span class="option-icon">🕐</span>
              <span class="option-text">5 min</span>
            </button>
          </div>
        </div>
        <div class="sabotage-modal-footer">
          <button class="btn btn-primary" @click="closeSabotageModal">Anuluj</button>
        </div>
      </div>
    </div>
    
    <!-- Role Modal -->
    <div v-if="showRoleModal" class="role-modal-overlay" @click="closeRoleModal">
      <div class="role-modal-content" @click.stop>
        <div class="role-modal-header">
          <h3>🎭 Twoja Rola</h3>
          <button @click="closeRoleModal" class="close-btn">&times;</button>
        </div>
        
        <div class="role-modal-body">
          <div class="role-info">
            <div class="role-title" :class="getRoleClass()">
              {{ playerRole }}
            </div>
            <div v-if="roleDescription" class="role-description">
              {{ roleDescription }}
            </div>
            <div v-if="playerRole.includes('Impostor') && roleDescription" class="role-title" :class="getRoleClass()">
              {{ 'Impostorzy' }}
              <br>
              {{ gameState.impostorsNames }}
            </div>
          </div>
          
          <!-- Detective functionality -->
          <div v-if="checkedPlayerRole && checkedPlayerName" class="checked-role-result">
            <h4>🔍 Wynik sprawdzenia:</h4>
            <div class="checked-player-info">
              <p><strong>Sprawdzony gracz:</strong> {{ checkedPlayerName }}</p>
              <p><strong>Rola:</strong> <span :class="checkedPlayerRole.includes('Impostor') ? 'checked-role-impostor' : 'checked-role-crewmate'">{{ checkedPlayerRole }}</span></p>
            </div>
          </div>
          <div v-if="playerRole === 'Detective' && !gameState.isDetectiveUsed && !roleDescription" class="detective-section">
            <div>
              <h4>🔍 Sprawdź rolę gracza:</h4>
              <div v-if="detectiveLoading" class="detective-loading">
                <p>⏳ Ładowanie graczy...</p>
              </div>
              <div v-else-if="!detectivePlayers || detectivePlayers.length === 0" class="no-detective-players">
                <p>❌ Brak graczy do sprawdzenia</p>
              </div>
              <div v-else class="detective-players-list">
                <div v-if="detectiveActionLoading" class="detective-loading">
                  <p>⏳ Sprawdzanie roli...</p>
                </div>
                <div v-else class="detective-player-item" 
                     v-for="player in detectivePlayers" 
                     :key="player.id"
                     @click="selectDetectivePlayer(player)"
                     :class="{ 'selected': selectedDetectivePlayer?.id === player.id }"
                >
                  <div class="player-info">
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-status" :class="{ 'alive': player.isAlive, 'dead': !player.isAlive }">
                      {{ player.isAlive ? '🟢 Żywy' : '🔴 Martwy' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="role-modal-footer">
          <button class="btn btn-primary" @click="closeRoleModal">Rozumiem</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'

export default {
  name: 'App',
  setup() {
    const activeTab = ref('player')
    const isLoggedIn = ref(false)
    const loading = ref(false)
    const message = ref('')
    const messageType = ref('success')
    const loginError = ref('')
    
    // Admin and O2 system tracking - persistent across sessions
    const hasBeenAdmin = ref(localStorage.getItem('hasBeenAdmin') === 'true')
    const o2Choice = ref(localStorage.getItem('o2Choice') || 'none') // 'none', 'first', 'second'
    
    // Login data
    const loginData = ref({
      username: '',
      password: ''
    })
    
    // Player registration data
    const playerName = ref('')
    const playerRegistrationLoading = ref(false)
    const registeredPlayerName = ref(localStorage.getItem('registeredPlayerName') || '')
    const isPlayerRegistered = ref(!!localStorage.getItem('registeredPlayerName'))
    
    // Active game login data
    const isLoggedInToGame = ref(false) // Czy gracz jest zalogowany do aktywnej gry
    const showGameView = ref(false) // Czy pokazać widok gry
    
    // Game data
    const settings = ref(null)
    const players = ref([])
    const tasks = ref([])
    const playersLoaded = ref(false)
    const tasksLoaded = ref(false)
    const showPlayerRoles = ref(false) // Kontroluje widoczność ról graczy
    
    // Player-specific data
    const playerTasks = ref([]) // Taski aktualnego gracza
    const playerTasksLoading = ref(false)

    
    // Panic functionality
    const showPanicModal = ref(false)
    const alivePlayers = ref([])
    const loadingPlayers = ref(false)
    
    // Victory modal functionality
    const showVictoryModal = ref(false)
    
    // Role modal functionality
    const showRoleModal = ref(false)
    const playerRole = ref('')
    const roleDescription = ref('')
    const roleModalShown = ref(false)
    
    // Kill confirmation modal functionality
    const showKillConfirmModal = ref(false)
    
    // Report confirmation modal functionality
    const showReportConfirmModal = ref(false)
    const reportLoading = ref(false)
    const killLoading = ref(false)
    
    // Emergency modal functionality
    const showEmergencyModal = ref(false)
    
    // Map modal functionality
    const showMapModal = ref(false)
    const activeMapTab = ref('out')
    
    // Task details modal functionality
    const showTaskDetailsModal = ref(false)
    const selectedTask = ref(null)
    const taskCompletionLoading = ref(false)
    
    // Blackmail modal functionality
    const showBlackmailModal = ref(false)
    const blackmailPlayers = ref([])
    const selectedBlackmailPlayer = ref(null)
    const blackmailLoading = ref(false)
    const blackmailActionLoading = ref(false)
    
    // Detective functionality
    const detectivePlayers = ref([])
    const selectedDetectivePlayer = ref(null)
    const detectiveLoading = ref(false)
    const detectiveActionLoading = ref(false)
    const checkedPlayerRole = ref(localStorage.getItem('checkedPlayerRole') || '')
    const checkedPlayerName = ref(localStorage.getItem('checkedPlayerName') || '')
    const showCheckedRole = ref(false)
    
    // Sabotage modal functionality
    const showSabotageModal = ref(false)
    const sabotageLoading = ref(false)
    
    // New task form
    const newTask = ref({
      name: '',
      location: '',
      description: ''
    })
    
    // SignalR configuration
    const connection = ref(null)
    const connectionStatus = ref('Disconnected')
    const hubUrl = 'https://agrosense-web-app.azurewebsites.net/amogus-status-hub'//process.env.NODE_ENV === 'development' 
      // ? '/amogus-status-hub'  // Używa proxy w developmencie
      // : 'http://localhost:7144/amogus-status-hub'  // Fallback dla produkcji
    
    // Game state (z CheckGameModel)
    const gameState = ref({
      playersInfo: [],           // List<PlayerInfo>
      isGameActive: false,       // bool
      sabotageStartDateUtc: null,        // DateTime?
      impostorsNames: '',        // string
      isPanic: false,            // bool
      panicReporter: '',         // string
      isCorpse: false,           // bool
      corpseReporter: '',        // string
      sabotageDeadlineDateUtc: null, // DateTime?
      tasksToComplete: null, 
      completedTasks: null,
      winningTeam: '',
      isBlackmailUsed: false, // bool
      sabotageCooldownDateUtc: null,
      panicCooldown: null,
      isDetectiveUsed: false
    })
    
    // Konfiguracja API z fallback
    const API_BASE = 'https://agrosense-web-app.azurewebsites.net/api/admin' //process.env.NODE_ENV === 'development' 
      // ? '/api/admin'  // Używa proxy w developmencie
      // : 'http://localhost:7144/api/admin'  // Fallback dla produkcji (zmień na HTTP jeśli HTTPS nie działa)
    
    const PLAYER_API_BASE = 'https://agrosense-web-app.azurewebsites.net/api/player' //process.env.NODE_ENV === 'development' 
      // ? '/api/player'  // Używa proxy w developmencie
      // : 'http://localhost:7144/api/player'  // Fallback dla produkcji

    const HEADQUARTERS_API_BASE = 'https://agrosense-web-app.azurewebsites.net/api/hq' //process.env.NODE_ENV === 'development' 
      // ? '/api/hq'  // Używa proxy w developmencie
      // : 'http://localhost:7144/api/hq'  // Fallback dla produkcji

    const IMPOSTORS_API_BASE = 'https://agrosense-web-app.azurewebsites.net/api/impostor' //process.env.NODE_ENV === 'development' 
      // ? '/api/impostor'  // Używa proxy w developmencie
      // : 'http://localhost:7144/api/impostor'  // Fallback dla produkcji

    // Utility functions
    const getAuthHeaders = () => {
      const token = localStorage.getItem('adminToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
    
    const showMessage = (msg, type = 'success') => {
      message.value = msg
      messageType.value = type
      setTimeout(() => {
        message.value = ''
      }, 5000)
    }
    
    const setActiveTab = (tabName) => {
      // Jeśli użytkownik przechodzi na "Drugie O2" i był na "Panel główny", 
      // przekieruj go na zakładkę "Admin"
      if (tabName === 'o2-second' && activeTab.value === 'main') {
        activeTab.value = 'admin'
      } else {
        activeTab.value = tabName
      }
      
      // Track O2 choice - once chosen, the other option disappears forever
      if (tabName === 'o2-first' && o2Choice.value === 'none') {
        o2Choice.value = 'first'
        localStorage.setItem('o2Choice', 'first')
      } else if (tabName === 'o2-second' && o2Choice.value === 'none') {
        o2Choice.value = 'second'
        localStorage.setItem('o2Choice', 'second')
        // Po wyborze "Drugie O2" ustaw aktywną zakładkę
        if (activeTab.value !== 'admin') {
          activeTab.value = 'o2-second'
        }
      }
    }
    
    // Victory modal functions
    const closeVictoryModal = () => {
      showVictoryModal.value = false
    }
    
    // Kill confirmation modal functions
    const showKillConfirm = () => {
      showKillConfirmModal.value = true
    }
    
    const closeKillConfirmModal = () => {
      showKillConfirmModal.value = false
    }
    
    const confirmKill = async () => {
      if (!registeredPlayerName.value) {
        showMessage('Błąd: Brak nazwy gracza', 'error')
        return
      }
      
      killLoading.value = true
      
      try {
        const response = await fetch(`${PLAYER_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/kill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          showMessage('Akcja "Kill" została wykonana pomyślnie!', 'success')
          closeKillConfirmModal()
        } else {
          const errorText = await response.text()
          showMessage(`Błąd podczas wykonywania akcji: ${errorText}`, 'error')
        }
      } catch (error) {
        console.error('Błąd podczas wykonywania akcji Kill:', error)
        showMessage('Błąd połączenia z serwerem', 'error')
      } finally {
        killLoading.value = false
      }
    }
    
    // Report confirmation modal functions
    const showReportConfirm = () => {
      showReportConfirmModal.value = true
    }
    
    const closeReportConfirmModal = () => {
      showReportConfirmModal.value = false
    }
    
    const confirmReport = async () => {
      if (!registeredPlayerName.value) {
        showMessage('Błąd: Brak nazwy gracza', 'error')
        return
      }
      
      reportLoading.value = true
      
      try {
        const response = await fetch(`${PLAYER_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/corpse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          showMessage('Martwe ciało zostało zgłoszone pomyślnie!', 'success')
          closeReportConfirmModal()
        } else {
          const errorText = await response.text()
          showMessage(`Błąd podczas zgłaszania martwego ciała: ${errorText}`, 'error')
        }
      } catch (error) {
        console.error('Błąd podczas zgłaszania martwego ciała:', error)
        showMessage('Błąd połączenia z serwerem', 'error')
      } finally {
        reportLoading.value = false
      }
    }
    

    
    // Map modal functions
    const openMapModal = () => {
      console.log('openMapModal');

      showMapModal.value = true
    }
    
    const closeMapModal = () => {
      showMapModal.value = false
    }
    
    const setActiveMapTab = (tab) => {
      activeMapTab.value = tab
    }
    
    // Task details modal functions
    const showTaskDetails = (task) => {
      selectedTask.value = task
      showTaskDetailsModal.value = true
    }
    
    const closeTaskDetailsModal = () => {
      showTaskDetailsModal.value = false
      selectedTask.value = null
    }
    
    const completeTaskFromModal = async (taskId) => {
      taskCompletionLoading.value = true
      
      try {
        await completeTask(taskId)
        closeTaskDetailsModal()
        showMessage('Zadanie zostało zakończone pomyślnie!', 'success')
      } catch (error) {
        showMessage('Błąd podczas kończenia zadania', 'error')
      } finally {
        taskCompletionLoading.value = false
      }
    }
    
    // Blackmail functions
    const openBlackmailModal = async () => {
      // Sprawdź rolę aktualnego gracza
      const currentPlayer = gameState.value.playersInfo.find(
        player => player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      )
      
      if (!currentPlayer) {
        showMessage('Błąd: Nie można znaleźć informacji o graczu', 'error')
        return
      }
      
      // Sprawdź czy gracz może używać blackmail
      if (currentPlayer.role !== 'ImpostorBlackmailer' || gameState.value.isBlackmailUsed) {
        showMessage('Nie możesz użyć szantażu', 'error')
        return
      }
      
      // Otwórz modal i załaduj graczy
      showBlackmailModal.value = true
      await loadBlackmailPlayers()
    }
    
    const closeBlackmailModal = () => {
      showBlackmailModal.value = false
      selectedBlackmailPlayer.value = null
      blackmailPlayers.value = []
    }
    
    const loadBlackmailPlayers = async () => {
      blackmailLoading.value = true
      
      try {
        const response = await fetch(`${IMPOSTORS_API_BASE}/users-to-blackmail`, {
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          blackmailPlayers.value = await response.json()
          console.log('✅ Załadowano graczy do szantażowania:', blackmailPlayers.value)
        } else {
          const errorText = await response.text()
          showMessage(`Błąd ładowania graczy: ${errorText}`, 'error')
          console.error('❌ Błąd ładowania graczy do szantażowania:', response.status, errorText)
        }
      } catch (error) {
        showMessage('Błąd ładowania graczy do szantażowania', 'error')
        console.error('💥 Błąd podczas ładowania graczy do szantażowania:', error)
      } finally {
        blackmailLoading.value = false
      }
    }
    
    const selectBlackmailPlayer = async (player) => {
      console.log(player)

      if (!player.name) {
        showMessage('Wybierz gracza do szantażowania', 'error')
        return
      }
      
      blackmailActionLoading.value = true
      
      try {
        const response = await fetch(`${IMPOSTORS_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/blackmail/${encodeURIComponent(player.name)}`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          showMessage(`✅ Szantaż wykonany pomyślnie na graczu: ${player.name}`, 'success')
          console.log('✅ Szantaż wykonany:', player.name)
        } else {
          const errorText = await response.text()
          showMessage(`Błąd szantażu: ${errorText}`, 'error')
          console.error('❌ Błąd szantażu:', response.status, errorText)
        }
      } catch (error) {
        showMessage('Błąd podczas wykonywania szantażu', 'error')
        console.error('💥 Błąd podczas szantażu:', error)
      } finally {
        blackmailActionLoading.value = false
        closeBlackmailModal() // Zawsze zamykaj modal
      }
    }
    
    // Sabotage functions
    const openSabotageModal = async () => {
      // Sprawdź rolę aktualnego gracza
      const currentPlayer = gameState.value.playersInfo.find(
        player => player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      )
      
      if (!currentPlayer) {
        return
      }
      
      // Sprawdź czy gracz może używać sabotażu
      if (!currentPlayer.role.includes('Impostor')) {
        return
      }

      // Sprawdź cooldown (porównanie UTC)
      const nowUtc = Date.now()
      if (gameState.value.sabotageCooldownDateUtc && gameState.value.sabotageCooldownDateUtc > nowUtc) {
        console.log(gameState.value.sabotageCooldownDateUtc)
        console.log(nowUtc)
        return
      }
      
      // Otwórz modal
      showSabotageModal.value = true
    }
    
    const closeSabotageModal = () => {
      showSabotageModal.value = false
    }
    
    const executeSabotage = async (delay) => {
      sabotageLoading.value = true
      
      try {
        const response = await fetch(`${IMPOSTORS_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/sabotage/${delay}`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          const delayText = delay === 0 ? 'natychmiast' : `${delay} min`
          showMessage(`✅ Sabotaż O2 wykonany pomyślnie (opóźnienie: ${delayText})`, 'success')
          console.log('✅ Sabotaż O2 wykonany z opóźnieniem:', delay)
        } else {
          const errorText = await response.text()
          showMessage(`Błąd sabotażu: ${errorText}`, 'error')
          console.error('❌ Błąd sabotażu:', response.status, errorText)
        }
      } catch (error) {
        showMessage('Błąd podczas wykonywania sabotażu', 'error')
        console.error('💥 Błąd podczas sabotażu:', error)
      } finally {
        sabotageLoading.value = false
        closeSabotageModal() // Zawsze zamykaj modal
      }
    }
    
    // Detective functions
    const loadDetectivePlayers = async () => {
      detectiveLoading.value = true
      
      try {
        const response = await fetch(`${IMPOSTORS_API_BASE}/users-to-blackmail`, {
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          const allPlayers = await response.json()
          detectivePlayers.value = allPlayers.filter(player => player.isAlive)
          console.log('✅ Załadowano graczy do sprawdzenia:', detectivePlayers.value)
        } else {
          const errorText = await response.text()
          showMessage(`Błąd ładowania graczy: ${errorText}`, 'error')
          console.error('❌ Błąd ładowania graczy do sprawdzenia:', response.status, errorText)
        }
      } catch (error) {
        showMessage('Błąd ładowania graczy do sprawdzenia', 'error')
        console.error('💥 Błąd podczas ładowania graczy do sprawdzenia:', error)
      } finally {
        detectiveLoading.value = false
      }
    }
    
    const selectDetectivePlayer = async (player) => {
      if (!player.name) {
        showMessage('Wybierz gracza do sprawdzenia', 'error')
        return
      }
      
      detectiveActionLoading.value = true
      
      try {
        const response = await fetch(`${PLAYER_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/use-detective/${encodeURIComponent(player.name)}`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        
        if (response.ok || response.status === 202) {
          const role = await response.text()

          localStorage.setItem('checkedPlayerRole', role)
          localStorage.setItem('checkedPlayerName', player.name)
          
          // Update reactive variables
          checkedPlayerRole.value = role
          checkedPlayerName.value = player.name

          selectedDetectivePlayer.value = player
          showCheckedRole.value = true
          showMessage(`✅ Sprawdzono rolę gracza: ${player.name}`, 'success')
          console.log('✅ Sprawdzono rolę:', player.name, role)
        } else {
          const errorText = await response.text()
          showMessage(`Błąd sprawdzania roli: ${errorText}`, 'error')
          console.error('❌ Błąd sprawdzania roli:', response.status, errorText)
        }
      } catch (error) {
        showMessage('Błąd podczas sprawdzania roli', 'error')
        console.error('💥 Błąd podczas sprawdzania roli:', error)
      } finally {
        detectiveActionLoading.value = false
      }
    }
    
    // SignalR functions
    const initializeSignalR = async () => {
      try {
        connection.value = new HubConnectionBuilder()
          .withUrl(hubUrl, {
            withCredentials: true,
            transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build()
        
        // Event handlers
        connection.value.onreconnecting(() => {
          connectionStatus.value = 'Reconnecting'
          console.log('SignalR: Reconnecting...')
        })
        
        connection.value.onreconnected(() => {
          connectionStatus.value = 'Connected'
          console.log('SignalR: Reconnected')
          // Check game state after reconnection
          setTimeout(() => checkGame(), 1000)
        })
        
        connection.value.onclose(() => {
          connectionStatus.value = 'Disconnected'
          console.log('SignalR: Connection closed')
        })
        
        // Game event handlers
        connection.value.on('AmogusStatus', (status) => {
          console.log('Otrzymano status gry:', status)
          updateGameState(status)

          // Sprawdź czy pokazać modal z rolą
          setTimeout(() => {
            console.log('🎭 showRoleInfo() wywołana')
            showRoleInfo()
          }, 500) // Krótkie opóźnienie aby upewnić się że gameState jest zaktualizowany
          
        })
        
        await connection.value.start()
        connectionStatus.value = 'Connected'
        console.log('SignalR: Połączono pomyślnie')
        showMessage('Połączono z serwerem w czasie rzeczywistym')
        
        // Check game state after SignalR connection is established
        setTimeout(() => checkGame(), 1000) // Slight delay to ensure connection is stable
        
      } catch (error) {
        connectionStatus.value = 'Error'
        console.error('SignalR: Błąd połączenia:', error)
        showMessage('Błąd połączenia z serwerem w czasie rzeczywistym', 'error')
      }
    }
    
    const disconnectSignalR = async () => {
      if (connection.value) {
        try {
          await connection.value.stop()
          console.log('SignalR: Rozłączono')
        } catch (error) {
          console.error('SignalR: Błąd rozłączania:', error)
        }
      }
    }
    
    // Game state management
    const updateGameState = (status) => {
      console.log('🔄 Aktualizacja game state:', status)
      
      // Reset role modal shown when game ends
      if (gameState.value.isGameActive && !status.isGameActive) {
        console.log('🎮 Gra się zakończyła, resetuję roleModalShown');
        roleModalShown.value = false;
        localStorage.removeItem('checkedPlayerRole')
        localStorage.removeItem('checkedPlayerName')
        checkedPlayerRole.value = ''
        checkedPlayerName.value = ''
      }
      
      // Reset sabotage checked flag when new sabotage starts
      if (!gameState.value.sabotageDeadlineDateUtc && status.sabotageDeadlineDateUtc) {
        console.log('💀 Nowy sabotaż rozpoczęty, resetuję sabotageChecked');
        sabotageChecked.value = false;
      }
      
      // Sprawdź czy gra się rozpoczęła (zmiana z false na true)
      if (!gameState.value.isGameActive && status.isGameActive && registeredPlayerName.value) {
        console.log('🎮 Gra się rozpoczęła! Automatyczne ładowanie zadań dla gracza:', registeredPlayerName.value)
        loadPlayerTasks()
        
        // Sprawdź czy pokazać modal z rolą po rozpoczęciu gry
        setTimeout(() => {
          showRoleInfo()
        }, 1000) // Opóźnienie aby upewnić się że gameState jest zaktualizowany
      }
      
      gameState.value = {
        playersInfo: status.playersInfo || [],
        isGameActive: status.isGameActive || false,
        sabotageStartDateUtc: status.sabotageStartDateUtc ? new Date(status.sabotageStartDateUtc) : null,
        impostorsNames: status.impostorsNames || '',
        isPanic: status.isPanic || false,
        panicReporter: status.panicReporter || '',
        isCorpse: status.isCorpse || false,
        corpseReporter: status.corpseReporter || '',
        sabotageDeadlineDateUtc: status.sabotageDeadlineDateUtc ? new Date(status.sabotageDeadlineDateUtc) : null,
        tasksToComplete: status.tasksToComplete || null,
        completedTasks: status.completedTasks || null,
        winningTeam: status.winningTeam || '',
        isBlackmailUsed: status.isBlackmailUsed || false,
        sabotageCooldownDateUtc: status.sabotageCooldownDateUtc ? new Date(status.sabotageCooldownDateUtc) : null,
        panicCooldown: status.panicCooldown ? new Date(status.panicCooldown) : null,
        isDetectiveUsed: status.isDetectiveUsed || false
      }
      
      // Sprawdź warunki zwycięstwa
      if (!status.isGameActive && status.winningTeam && status.winningTeam.trim() !== '') {
        showVictoryModal.value = true
        console.log('🏆 Gra zakończona! Zwyciężyła drużyna:', status.winningTeam)
      }
      else {
        showVictoryModal.value = false
      }
      
      // Sprawdź warunki modala awaryjnego (tylko na zakładce "Gracz")
      if (activeTab.value === 'player' && (status.isPanic || status.isCorpse)) {
        showEmergencyModal.value = true
        if (status.isPanic) {
          console.log('🚨 Panic zgłoszony przez:', status.panicReporter)
        }
        if (status.isCorpse) {
          console.log('💀 Martwe ciało zgłosił:', status.corpseReporter)
        }
      } else {
        showEmergencyModal.value = false
      }
      
      // Sprawdź czy zarejestrowany gracz nadal istnieje w grze
      checkPlayerRegistration(status)
      
      // Wywołuj odpowiednie handlery w zależności od stanu
      handleGameStateChanges(status)
    }
    
    const checkPlayerRegistration = (status) => {
      // Sprawdź czy gracz jest zarejestrowany
      if (!isPlayerRegistered.value || !registeredPlayerName.value) {
        return // Brak zarejestrowanego gracza
      }
      
      // Sprawdź czy lista graczy istnieje
      const playersInfo = status.playersInfo || []
      
      // Sprawdź czy zarejestrowany gracz znajduje się na liście
      const playerExists = playersInfo.some(player => 
        player.name && player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      )
      
      if (!playerExists) {
        const playerNameToRemove = registeredPlayerName.value
        console.log(`Gracz "${playerNameToRemove}" nie został znaleziony na liście graczy. Automatyczne wyrejestrowanie.`)
        
        // Automatycznie wyrejestruj gracza
        localStorage.removeItem('registeredPlayerName')
        registeredPlayerName.value = ''
        isPlayerRegistered.value = false
        isLoggedInToGame.value = false
        showGameView.value = false
        
        showMessage(`Gracz "${playerNameToRemove}" nie znajduje się w grze. Zostałeś wyrejestrowany.`, 'error')
      } else {
        // Gracz istnieje na liście
        if (status.isGameActive && isPlayerRegistered.value && !isLoggedInToGame.value) {
          // Automatycznie zaloguj gracza do aktywnej gry jeśli jest zarejestrowany
          isLoggedInToGame.value = true
          showGameView.value = true
          console.log(`Gracz "${registeredPlayerName.value}" automatycznie zalogowany do aktywnej gry`)
          
          // Load player tasks after automatic login
          loadPlayerTasks()
          
          // Check game state again to ensure we have latest data
          checkGame()
        }
      }
    }
    
    const handleGameStateChanges = (status) => {
      // Tu będą dodawane funkcje obsługi konkretnych stanów
      // zgodnie z instrukcjami użytkownika
      
      if (status.isGameActive) {
        handleGameActive(status)
      }
      
      if (status.isPanic) {
        handlePanicState(status)
      }
      
      if (status.isCorpse) {
        handleCorpseFound(status)
      }
      
      if (status.sabotageDeadlineDateUtc) {
        handleSabotage(status)
      }
      
      // Aktualizuj interfejs użytkownika
      updateUI(status)
    }
    
    const handleGameActive = (status) => {
      // Logika dla aktywnej gry
      console.log('Gra jest aktywna:', status)
    }
    
    const handlePanicState = (status) => {
      // Logika dla stanu paniki
      console.log('Panic zgłoszony przez:', status.panicReporter)
    }
    
    const handleCorpseFound = (status) => {
      // Logika dla znalezionego ciała
      console.log('Ciało znalezione przez:', status.corpseReporter)
    }
    
    const handleSabotage = (status) => {
      // Logika dla sabotażu tlenu
      console.log('Sabotaż tlenu - deadline:', status.sabotageDeadlineDateUtc)
    }
    
    // O2 System functions
    const pressFirstO2 = async () => {
      if (!gameState.value.sabotageDeadlineDateUtc) return
      
      try {
        const response = await fetch(`${HEADQUARTERS_API_BASE}/firstO2/true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log('Pierwsze O2: Przycisk wciśnięty')
        } else {
          console.error('Błąd wywołania firstO2/true')
        }
      } catch (error) {
        console.error('Błąd komunikacji z serwerem (firstO2/true):', error)
      }
    }
    
    const releaseFirstO2 = async () => {
      if (!gameState.value.sabotageDeadlineDateUtc) return
      
      try {
        const response = await fetch(`${HEADQUARTERS_API_BASE}/firstO2/false`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log('Pierwsze O2: Przycisk puszczony')
        } else {
          console.error('Błąd wywołania firstO2/false')
        }
      } catch (error) {
        console.error('Błąd komunikacji z serwerem (firstO2/false):', error)
      }
    }
    
    const pressSecondO2 = async () => {
      if (!gameState.value.sabotageDeadlineDateUtc) return
      
      try {
        const response = await fetch(`${HEADQUARTERS_API_BASE}/secondO2/true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log('Drugie O2: Przycisk wciśnięty')
        } else {
          console.error('Błąd wywołania secondO2/true')
        }
      } catch (error) {
        console.error('Błąd komunikacji z serwerem (secondO2/true):', error)
      }
    }
    
    const releaseSecondO2 = async () => {
      if (!gameState.value.sabotageDeadlineDateUtc) return
      
      try {
        const response = await fetch(`${HEADQUARTERS_API_BASE}/secondO2/false`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log('Drugie O2: Przycisk puszczony')
        } else {
          console.error('Błąd wywołania secondO2/false')
        }
      } catch (error) {
        console.error('Błąd komunikacji z serwerem (secondO2/false):', error)
      }
    }
    
    const updateUI = (status) => {
      // Aktualizuj interfejs użytkownika na podstawie stanu gry
      // Na przykład odśwież listę graczy jeśli jest załadowana
      if (playersLoaded.value) {
        // Możemy użyć danych z status zamiast robić fetch
        players.value = status.playersInfo || []
      }
    }
    
    // Auth functions
    const login = async () => {
      loading.value = true
      loginError.value = ''
      
      try {
        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginData.value.username,
            password: loginData.value.password
          })
        })
        
        if (response.ok) {
          const token = await response.text()
          localStorage.setItem('adminToken', token.replace(/"/g, ''))
          isLoggedIn.value = true
          // Track that user has been admin - enables O2 tabs forever
          hasBeenAdmin.value = true
          localStorage.setItem('hasBeenAdmin', 'true')
          activeTab.value = 'main'
          showMessage('Zalogowano pomyślnie!')
          await loadSettings()
        } else {
          const error = await response.text()
          loginError.value = error.replace(/"/g, '')
        }
      } catch (error) {
        if (error.message.includes('fetch')) {
          loginError.value = 'Błąd CORS/połączenia z serwerem. Sprawdź czy API działa na porcie 7144'
        } else {
          loginError.value = 'Błąd połączenia z serwerem'
        }
        console.error('Login error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const logout = () => {
      localStorage.removeItem('adminToken')
      isLoggedIn.value = false
      activeTab.value = 'player'
      settings.value = null
      players.value = []
      tasks.value = []
      playersLoaded.value = false
      tasksLoaded.value = false
      showMessage('Wylogowano pomyślnie!')
    }
    
    // Check game status on application load
    const checkGame = async () => {
      console.log('🎯 checkGame() wywołana przy odświeżeniu strony')
      
      try {
        const url = `${PLAYER_API_BASE}/check-game`
        console.log('📡 Wywołanie checkGame API:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('📊 checkGame response status:', response.status)
        
        if (response.ok) {
          // Sprawdź czy odpowiedź ma zawartość przed parsowaniem JSON
          const responseText = await response.text()
          console.log('📄 Raw response text:', responseText)
          
          if (!responseText || responseText.trim() === '') {
            console.warn('⚠️ Serwer zwrócił pustą odpowiedź')
            return
          }
          
          try {
            const gameData = JSON.parse(responseText)
            console.log('✅ Stan gry przy ładowaniu:', gameData)
            
            // Update game state with received data
            if (gameData) {
              updateGameState(gameData)
              console.log('🔄 Game state zaktualizowany z checkGame')
            }
          } catch (jsonError) {
            console.error('❌ Błąd parsowania JSON:', jsonError)
            console.error('📄 Niepoprawna odpowiedź z serwera:', responseText)
          }
        } else {
          console.warn('❌ Nie udało się pobrać stanu gry:', response.status)
          const errorText = await response.text()
          console.warn('❌ Error response:', errorText)
        }

        loadPlayerTasks();

      } catch (error) {
        console.error('💥 Błąd podczas sprawdzania stanu gry:', error)
        if (error.message.includes('fetch')) {
          console.error('🌐 Problem z połączeniem sieciowym - sprawdź czy API działa na porcie 7144')
        }
      }
    }
    
    // Player registration functions
    const registerPlayer = async () => {
      if (!playerName.value.trim()) {
        showMessage('Wprowadź nazwę gracza', 'error')
        return
      }
      
      playerRegistrationLoading.value = true
      
      try {
        const response = await fetch(`${PLAYER_API_BASE}/${encodeURIComponent(playerName.value.trim())}/sign-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          // Zapisz nazwę gracza w localStorage
          const playerNameToSave = playerName.value.trim()
          localStorage.setItem('registeredPlayerName', playerNameToSave)
          registeredPlayerName.value = playerNameToSave
          isPlayerRegistered.value = true
          playerName.value = ''
          
          if (response.status === 202) { // Accepted
            showMessage('Pomyślnie zarejestrowano do gry!', 'success')
          } else {
            showMessage('Pomyślnie zalogowano do gry!', 'success')
          }
        } else {
          const error = await response.text()
          showMessage(error.replace(/"/g, ''), 'error')
        }
      } catch (error) {
        if (error.message.includes('fetch')) {
          showMessage('Błąd połączenia z serwerem. Sprawdź czy API działa na porcie 7144', 'error')
        } else {
          showMessage('Błąd rejestracji gracza', 'error')
        }
        console.error('Player registration error:', error)
      } finally {
        playerRegistrationLoading.value = false
      }
    }
    
    const loginToGame = async () => {
      if (!playerName.value.trim()) {
        showMessage('Wprowadź nazwę gracza', 'error')
        return
      }
      
      playerRegistrationLoading.value = true
      
      try {
        const response = await fetch(`${PLAYER_API_BASE}/${encodeURIComponent(playerName.value.trim())}/sign-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          // Zapisz nazwę gracza w localStorage
          const playerNameToSave = playerName.value.trim()
          localStorage.setItem('registeredPlayerName', playerNameToSave)
          registeredPlayerName.value = playerNameToSave
          isPlayerRegistered.value = true
          isLoggedInToGame.value = true
          showGameView.value = true
          playerName.value = ''
          
          showMessage('Pomyślnie zalogowano do gry!', 'success')
          
          // Load player tasks after successful login
          await loadPlayerTasks()
          
          // Check game state to get latest data
          checkGame()
        } else {
          const error = await response.text()
          showMessage(error.replace(/"/g, ''), 'error')
        }
      } catch (error) {
        if (error.message.includes('fetch')) {
          showMessage('Błąd połączenia z serwerem. Sprawdź czy API działa na porcie 7144', 'error')
        } else {
          showMessage('Błąd logowania do gry', 'error')
        }
        console.error('Game login error:', error)
      } finally {
        playerRegistrationLoading.value = false
      }
    }
    
    // Load player tasks
    const loadPlayerTasks = async () => {
      console.log('🔍 loadPlayerTasks wywołana, registeredPlayerName:', registeredPlayerName.value)
      
      if (!registeredPlayerName.value) {
        console.warn('Brak nazwy gracza do pobrania tasków')
        return
      }
      
      playerTasksLoading.value = true
      console.log('⏳ Ładowanie tasków, playerTasksLoading ustawione na true')
      
      try {
        const url = `${PLAYER_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/tasks`
        console.log('📡 Wywołanie API:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('📊 Response status:', response.status)
        
        if (response.ok) {
          const tasks = await response.json()
          playerTasks.value = tasks || []
          console.log('✅ Pobrano taski gracza:', tasks)
          console.log('📋 playerTasks.value po przypisaniu:', playerTasks.value)
        } else {
          const errorText = await response.text()
          console.warn('❌ Nie udało się pobrać tasków gracza:', response.status, errorText)
          playerTasks.value = []
        }
      } catch (error) {
        console.error('💥 Błąd podczas pobierania tasków gracza:', error)
        playerTasks.value = []
      } finally {
        playerTasksLoading.value = false
        console.log('✨ playerTasksLoading ustawione na false')
      }
    }
    
    // Player task functions
    const completeTask = async (taskId) => {
      console.log('🎯 Próba zakończenia zadania:', taskId)
      
      if (!registeredPlayerName.value) {
        showMessage('Błąd: Brak nazwy gracza', 'error')
        return
      }
      
      try {
        const response = await fetch(`${PLAYER_API_BASE}/${encodeURIComponent(registeredPlayerName.value)}/complete-task/${taskId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          showMessage('✅ Zadanie zakończone pomyślnie!')
          console.log('✅ Zadanie zakończone:', taskId)
          
          // Odśwież listę zadań
          await loadPlayerTasks()
        } else {
          const errorText = await response.text()
          showMessage(`Błąd zakończenia zadania: ${errorText}`, 'error')
          console.error('❌ Błąd zakończenia zadania:', response.status, errorText)
        }
      } catch (error) {
        showMessage('Błąd zakończenia zadania', 'error')
        console.error('💥 Błąd podczas zakończenia zadania:', error)
      }
    }
    
    // Settings functions
    const loadSettings = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/settings`, {
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          settings.value = await response.json()
        } else {
          throw new Error('Błąd pobierania ustawień')
        }
      } catch (error) {
        showMessage('Błąd pobierania ustawień', 'error')
        console.error('Load settings error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const saveSettings = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            taskPerPlayer: settings.value.taskPerPlayer,
            sabotageDeadlineFromMinutes: settings.value.sabotageDeadlineFromMinutes,
            impostorsAmount: settings.value.impostorsAmount,
            detectivesAmount: settings.value.detectivesAmount,
            doctorsAmount: settings.value.doctorsAmount,
            panicCooldownFromMinutes: settings.value.panicCooldownFromMinutes,
            sabotageCooldownFromMinutes: settings.value.sabotageCooldownFromMinutes
          })
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          showMessage('Ustawienia zapisane pomyślnie!')
        } else {
          throw new Error('Błąd zapisywania ustawień')
        }
      } catch (error) {
        showMessage('Błąd zapisywania ustawień', 'error')
        console.error('Save settings error:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Game control functions
    const startGame = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/start`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          showMessage('Gra rozpoczęta pomyślnie!')
          await loadSettings()
        } else {
          const error = await response.text()
          showMessage(error.replace(/"/g, ''), 'error')
        }
      } catch (error) {
        showMessage('Błąd rozpoczynania gry', 'error')
        console.error('Start game error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const stopGame = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/stop`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          showMessage('Gra zatrzymana pomyślnie!')
          await loadSettings()
        } else {
          throw new Error('Błąd zatrzymywania gry')
        }
      } catch (error) {
        showMessage('Błąd zatrzymywania gry', 'error')
        console.error('Stop game error:', error)
      } finally {
        loading.value = false
      }
    }
    
    // O2 System Management
    const clearO2Data = () => {
      if (!confirm('Czy na pewno chcesz wyczyścić wszystkie dane związane z systemami O2? Ta akcja spowoduje ukrycie zakładek "Pierwsze O2" i "Drugie O2" dla wszystkich użytkowników.')) {
        return
      }
      
      try {
        // Usuń dane O2 z localStorage
        localStorage.removeItem('hasBeenAdmin')
        localStorage.removeItem('o2Choice')
        
        // Usuń też stare klucze jeśli istnieją
        localStorage.removeItem('o2SystemActivated')
        localStorage.removeItem('o2FirstActivated')
        localStorage.removeItem('o2SecondActivated')
        
        // Zaktualizuj stan aplikacji
        hasBeenAdmin.value = false
        o2Choice.value = 'none'
        
        showMessage('Dane systemów O2 zostały wyczyszczone. Zakładki O2 zostały ukryte.', 'success')
        
        console.log('O2 data cleared successfully')
      } catch (error) {
        showMessage('Błąd podczas czyszczenia danych O2', 'error')
        console.error('Error clearing O2 data:', error)
      }
    }
    
    // Players functions
    const loadPlayers = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/players`, {
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          players.value = await response.json()
          playersLoaded.value = true
        } else {
          throw new Error('Błąd pobierania graczy')
        }
      } catch (error) {
        showMessage('Błąd pobierania graczy', 'error')
        console.error('Load players error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const resetPlayers = async () => {
      if (!confirm('Czy na pewno chcesz usunąć wszystkich graczy?')) {
        return
      }
      
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/reset-players`, {
          method: 'POST',
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          showMessage('Gracze zostali zresetowani!')
          players.value = []
        } else {
          throw new Error('Błąd resetowania graczy')
        }
      } catch (error) {
        showMessage('Błąd resetowania graczy', 'error')
        console.error('Reset players error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const togglePlayerRoles = () => {
      showPlayerRoles.value = !showPlayerRoles.value
    }
    
    // Tasks functions
    const loadTasks = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/tasks`, {
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          tasks.value = await response.json()
          tasksLoaded.value = true
        } else {
          throw new Error('Błąd pobierania zadań')
        }
      } catch (error) {
        showMessage('Błąd pobierania zadań', 'error')
        console.error('Load tasks error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const createTask = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/task`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: "",
            name: newTask.value.name,
            location: newTask.value.location,
            description: newTask.value.description
          })
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          showMessage('Zadanie dodane pomyślnie!')
          newTask.value = { name: '', location: '', description: '' }
          await loadTasks()
        } else {
          throw new Error('Błąd dodawania zadania')
        }
      } catch (error) {
        showMessage('Błąd dodawania zadania', 'error')
        console.error('Create task error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const deleteTask = async (taskId) => {
      if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        return
      }
      
      loading.value = true
      
      try {
        const response = await fetch(`${API_BASE}/task/${taskId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
        
        if (response.status === 401) {
          logout()
          return
        }
        
        if (response.ok) {
          showMessage('Zadanie usunięte pomyślnie!')
          await loadTasks()
        } else {
          throw new Error('Błąd usuwania zadania')
        }
      } catch (error) {
        showMessage('Błąd usuwania zadania', 'error')
        console.error('Delete task error:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Panic functions
    const showPanicDialog = async () => {
      const now = currentTime.value;
      
      // Check if panic cooldown exists and is still active
      if (gameState.value.panicCooldown) {
        const cooldownTime = gameState.value.panicCooldown.getTime();
        
        if (cooldownTime > now) {
          return; // Cooldown nadal trwa
        }
      }

      showPanicModal.value = true
      await loadAlivePlayers()
    }
    
    const closePanicDialog = () => {
      showPanicModal.value = false
      alivePlayers.value = []
    }
    
    const loadAlivePlayers = async () => {
      loadingPlayers.value = true
      
      try {
        alivePlayers.value = gameState.value.playersInfo.filter(player => player.isAlive)
      } catch (error) {
        showMessage('Błąd pobierania listy graczy', 'error')
        console.error('Load alive players error:', error)
        alivePlayers.value = []
      } finally {
        loadingPlayers.value = false
      }
    }
    
    const startPanic = async (playerName) => {
      loading.value = true
      
      try {
        const response = await fetch(`${HEADQUARTERS_API_BASE}/${encodeURIComponent(playerName)}/start-panic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          showMessage(`Panika została zgłoszona przez gracza ${playerName}!`)
          closePanicDialog()
        } else {
          const errorText = await response.text()
          // Usuń cudzysłowy z odpowiedzi jeśli istnieją
          const cleanError = errorText.replace(/"/g, '')
          showMessage(cleanError, 'error')
        }
      } catch (error) {
        showMessage('Błąd podczas zgłaszania paniki', 'error')
        console.error('Start panic error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const endPanic = async () => {
      loading.value = true
      
      try {
        const response = await fetch(`${HEADQUARTERS_API_BASE}/end-panic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          showMessage('Spotkanie zostało zakończone pomyślnie!', 'success')
        } else {
          const errorText = await response.text()
          const cleanError = errorText.replace(/"/g, '')
          showMessage(`Błąd podczas kończenia spotkania: ${cleanError}`, 'error')
        }
      } catch (error) {
        showMessage('Błąd połączenia z serwerem podczas kończenia spotkania', 'error')
        console.error('End panic error:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Check if user is already logged in and migrate O2 localStorage
    onMounted(async () => {
      // Check initial game state first - before any other operations
      await checkGame()
      
      // Migrate from old O2 systems to new hasBeenAdmin + o2Choice system
      const oldO2System = localStorage.getItem('o2SystemActivated') === 'true'
      const oldO2First = localStorage.getItem('o2FirstActivated') === 'true'
      const oldO2Second = localStorage.getItem('o2SecondActivated') === 'true'
      
      if (oldO2System || oldO2First || oldO2Second) {
        // If any old O2 system was used, mark as hasBeenAdmin
        hasBeenAdmin.value = true
        localStorage.setItem('hasBeenAdmin', 'true')
        
        // Determine choice based on old data
        if (oldO2First && !oldO2Second) {
          o2Choice.value = 'first'
          localStorage.setItem('o2Choice', 'first')
        } else if (oldO2Second && !oldO2First) {
          o2Choice.value = 'second'
          localStorage.setItem('o2Choice', 'second')
        } else {
          // Default to none if unclear
          o2Choice.value = 'none'
          localStorage.setItem('o2Choice', 'none')
        }
        
        // Clean up old keys
        localStorage.removeItem('o2SystemActivated')
        localStorage.removeItem('o2FirstActivated')
        localStorage.removeItem('o2SecondActivated')
      }
      
      const token = localStorage.getItem('adminToken')
      if (token) {
        isLoggedIn.value = true
        // Also mark as hasBeenAdmin if token exists
        if (!hasBeenAdmin.value) {
          hasBeenAdmin.value = true
          localStorage.setItem('hasBeenAdmin', 'true')
        }
        activeTab.value = 'main'
        loadSettings()
      }
      
      // Initialize SignalR connection
      initializeSignalR()
      
      // Add event listeners for page visibility and focus
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('🔍 Strona stała się widoczna - wywołanie checkGame()')
          checkGame()
        }
      }
      
      const handleWindowFocus = () => {
        console.log('🔍 Okno uzyskało focus - wywołanie checkGame()')
        checkGame()
      }
      
      const handlePageShow = () => {
        console.log('🔍 PageShow event - wywołanie checkGame()')
        checkGame()
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleWindowFocus)
      window.addEventListener('pageshow', handlePageShow)
      
      // Store cleanup functions for unmount
      window.checkGameCleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleWindowFocus)
        window.removeEventListener('pageshow', handlePageShow)
      }
      
      // Start time update timer for reactive time-based computations
      startTimeUpdate()
    })
    
    // Cleanup SignalR connection on component unmount
    onBeforeUnmount(() => {
      disconnectSignalR()
      
      // Cleanup page visibility event listeners
      if (window.checkGameCleanup) {
        window.checkGameCleanup()
        delete window.checkGameCleanup
      }
      
      // Stop time update timer
      stopTimeUpdate()
    })
    
    const shouldShowOxygenAlert = computed(() => {
      if (!gameState.value.sabotageDeadlineDateUtc || !gameState.value.sabotageStartDateUtc) return false;
      return gameState.value.sabotageStartDateUtc <= currentTime.value;
    });
    
    const oxygenTimeLeft = computed(() => {
      if (!gameState.value.sabotageDeadlineDateUtc) {
        return null;
      }
      
      const now = currentTime.value;
      const deadlineTime = gameState.value.sabotageDeadlineDateUtc.getTime();
      
      if (deadlineTime <= now) {
        return null; // Czas minął
      }
      
      const timeLeft = deadlineTime - now;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      return {
        minutes,
        seconds,
        totalMs: timeLeft
      };
    });
    
    const isCurrentPlayerBlackmailed = computed(() => {
      if (!registeredPlayerName.value || !gameState.value.playersInfo || gameState.value.playersInfo.length === 0) {
        return false;
      }
      
      const currentPlayer = gameState.value.playersInfo.find(
        player => player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      );
      
      return currentPlayer ? currentPlayer.isBlackmailed : false;
    });
    
    const blackmailedPlayer = computed(() => {
      if (!gameState.value.playersInfo || gameState.value.playersInfo.length === 0) {
        return null;
      }
      
      return gameState.value.playersInfo.find(player => player.isBlackmailed) || null;
    });
    
    const panicCooldownTimeLeft = computed(() => {
      if (!gameState.value.panicCooldown) {
        return null;
      }
      
      const now = currentTime.value;
      const cooldownTime = gameState.value.panicCooldown.getTime();
      
      if (cooldownTime <= now) {
        return null; // Cooldown wygasł
      }
      
      const timeLeft = cooldownTime - now;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      return {
        minutes,
        seconds,
        totalMs: timeLeft
      };
    });
    
    const shouldShowRoleModal = computed(() => {
      if (!gameState.value.isGameActive || !registeredPlayerName.value || !gameState.value.playersInfo || gameState.value.playersInfo.length === 0) {
        return false;
      }
      
      const currentPlayer = gameState.value.playersInfo.find(
        player => player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      );
      
      return currentPlayer && currentPlayer.role && !roleModalShown.value;
    });
    
    // Current time for reactive updates
    const currentTime = ref(Date.now())
    let timeUpdateTimer = null
    
    // Track if sabotage has been checked to avoid multiple calls
    const sabotageChecked = ref(false)
    
        // Check sabotage deadline
    const checkSabotageDeadline = async () => {
      if (gameState.value.sabotageDeadlineDateUtc && gameState.value.sabotageDeadlineDateUtc <= Date.now() && !sabotageChecked.value) {
        console.log('⏰ Sabotaż się zakończył - sprawdzam status')
        sabotageChecked.value = true
        
        try {
          const response = await fetch(`${HEADQUARTERS_API_BASE}/check-sabotage`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            console.log('✅ Status sabotażu sprawdzony')
            showMessage('Status sabotażu został sprawdzony', 'success')
          } else {
            const errorText = await response.text()
            console.error('❌ Błąd podczas sprawdzania statusu sabotażu:', response.status, errorText)
            showMessage(`Błąd sprawdzania sabotażu: ${errorText}`, 'error')
          }
        } catch (error) {
          console.error('💥 Błąd podczas sprawdzania sabotażu:', error)
          showMessage('Błąd połączenia podczas sprawdzania sabotażu', 'error')
        }
      }
    }
    
    // Update current time every second
    const startTimeUpdate = () => {
      if (timeUpdateTimer) {
        clearInterval(timeUpdateTimer)
      }
      timeUpdateTimer = setInterval(() => {
        currentTime.value = Date.now()
        // Sprawdź sabotaż co sekundę
        checkSabotageDeadline()
      }, 1000)
    }
    
    const stopTimeUpdate = () => {
      if (timeUpdateTimer) {
        clearInterval(timeUpdateTimer)
        timeUpdateTimer = null
      }
    }

    const forceRoleShow = () => {
      showRoleInfo(true);
    }
    
    // Role modal functions
    const showRoleInfo = (force = false) => {
      console.log('🎭 showRoleInfo() wywołana');
      console.log('shouldShowRoleModal.value:', shouldShowRoleModal.value);
      console.log('registeredPlayerName.value:', registeredPlayerName.value);
      console.log('gameState.value.playersInfo:', gameState.value.playersInfo);
      
      if (!shouldShowRoleModal.value && !force) {
        console.log('❌ shouldShowRoleModal jest false, wychodzę');
        return;
      }
      
      const currentPlayer = gameState.value.playersInfo.find(
        player => player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      );
      
      console.log('currentPlayer:', currentPlayer);
      
      if (currentPlayer && currentPlayer.role) {
        console.log('✅ Znaleziono gracza z rolą:', currentPlayer.role);
        playerRole.value = currentPlayer.role;
        
        // Ustaw opis roli na podstawie nazwy
        switch (currentPlayer.role) {
          case 'Crewmate':
            roleDescription.value = 'Jesteś członkiem załogi. Twoim zadaniem jest ukończenie wszystkich zadań i znalezienie impostorów.';
            break;
          case 'Impostor':
            roleDescription.value = 'Jesteś impostorem! Twoim celem jest eliminacja członków załogi bez zostania złapanym.';
            break;
          case 'ImpostorBlackmailer':
            roleDescription.value = 'Jesteś impostorem-szantażystą! Możesz szantażować innych graczy, aby nie mogli głosować.';
            break;
          case 'Detective':
            roleDescription.value = 'Jesteś detektywem! Twoim zadaniem jest znalezienie impostorów.';
            break;
          case 'Doctor':
            roleDescription.value = 'Jesteś doktorem! Twoim zadaniem jest leczenie innych graczy.';
            break;
          default:
            roleDescription.value = `Twoja rola: ${currentPlayer.role}`;
        }

        if (force){
          roleDescription.value = null;
        }
        
        showRoleModal.value = true;
        roleModalShown.value = true; // Oznacz że modal już był pokazany
        console.log('🎭 Modal z rolą pokazany');
        
        // Load detective players if the player is a Detective and detective ability is not used
        if (currentPlayer.role === 'Detective' && !gameState.value.isDetectiveUsed) {
          console.log('🔍 Loading detective players...');
          loadDetectivePlayers();
        }
      } else {
        console.log('❌ Nie znaleziono gracza lub brak roli');
      }
    }
    
    const closeRoleModal = () => {
      showRoleModal.value = false;
      // Reset detective state
      detectivePlayers.value = [];
      selectedDetectivePlayer.value = null;
      detectiveLoading.value = false;
      detectiveActionLoading.value = false;
      // Keep checkedPlayerRole and checkedPlayerName for persistent display
      showCheckedRole.value = false;
    }
    
    const getRoleClass = () => {
      switch (playerRole.value) {
        case 'Crewmate':
          return 'role-crewmate';
        case 'Impostor':
        case 'ImpostorBlackmailer':
          return 'role-impostor';
        case 'Detective':
          return 'role-detective';
        case 'Doctor':
          return 'role-doctor';
        default:
          return 'role-default';
      }
    }
    
    // Computed property sprawdzająca czy gracz jest martwy
    const isPlayerDead = computed(() => {
      if (!registeredPlayerName.value || !gameState.value.playersInfo || gameState.value.playersInfo.length === 0) {
        return false;
      }
      
      const currentPlayer = gameState.value.playersInfo.find(
        player => player.name.toLowerCase() === registeredPlayerName.value.toLowerCase()
      );
      
      return currentPlayer ? !currentPlayer.isAlive : false;
    });
    
    return {
      activeTab,
      setActiveTab,
      isLoggedIn,
      loading,
      message,
      messageType,
      loginError,
      loginData,
      settings,
      players,
      tasks,
      playersLoaded,
      tasksLoaded,
      newTask,
      login,
      logout,
      // Player registration
      playerName,
      playerRegistrationLoading,
      registeredPlayerName,
      isPlayerRegistered,
      registerPlayer,
      loginToGame,
      // Game login state
      isLoggedInToGame,
      showGameView,
      // Player tasks
      playerTasks,
      playerTasksLoading,
      loadPlayerTasks,
      completeTask,
      loadSettings,
      saveSettings,
      startGame,
      stopGame,
      clearO2Data,
      loadPlayers,
      resetPlayers,
      showPlayerRoles,
      togglePlayerRoles,
      loadTasks,
      createTask,
      deleteTask,
      // Panic functionality
      showPanicModal,
      alivePlayers,
      loadingPlayers,
      showPanicDialog,
      closePanicDialog,
      startPanic,
      endPanic,
      // O2 system tracking
      hasBeenAdmin,
      o2Choice,
      // SignalR
      connection,
      connectionStatus,
      initializeSignalR,
      disconnectSignalR,
      // Game State
      gameState,
      updateGameState,
      checkGame,
      checkPlayerRegistration,
      handleGameStateChanges,
      handleGameActive,
      handlePanicState,
      handleCorpseFound,
      handleSabotage,
      // O2 System
      pressFirstO2,
      releaseFirstO2,
      pressSecondO2,
      releaseSecondO2,
      checkSabotageDeadline,
      sabotageChecked,
      // Victory modal
      showVictoryModal,
      closeVictoryModal,
      // Kill confirmation modal
      showKillConfirmModal,
      killLoading,
      showKillConfirm,
      closeKillConfirmModal,
      confirmKill,
      // Report confirmation modal
      showReportConfirmModal,
      reportLoading,
      showReportConfirm,
      closeReportConfirmModal,
      confirmReport,
      // Player actions
      // Map modal
      showMapModal,
      activeMapTab,
      openMapModal,
      closeMapModal,
      setActiveMapTab,
      // Task details modal
              showTaskDetailsModal,
        selectedTask,
        taskCompletionLoading,
        showTaskDetails,
        closeTaskDetailsModal,
        completeTaskFromModal,
        showBlackmailModal,
        blackmailPlayers,
        selectedBlackmailPlayer,
        blackmailLoading,
        blackmailActionLoading,
        openBlackmailModal,
        closeBlackmailModal,
        selectBlackmailPlayer,
        // Detective functionality
        detectivePlayers,
        selectedDetectivePlayer,
        detectiveLoading,
        detectiveActionLoading,
        checkedPlayerRole,
        checkedPlayerName,
        showCheckedRole,
        loadDetectivePlayers,
        selectDetectivePlayer,
        showSabotageModal,
        sabotageLoading,
        openSabotageModal,
        closeSabotageModal,
        executeSabotage,
      // Emergency modal
      showEmergencyModal,
      shouldShowOxygenAlert,
      oxygenTimeLeft,
      isCurrentPlayerBlackmailed,
      blackmailedPlayer,
      panicCooldownTimeLeft,
      // Role modal
      showRoleModal,
      playerRole,
      roleDescription,
      shouldShowRoleModal,
      showRoleInfo,
      forceRoleShow,
      closeRoleModal,
      getRoleClass,
      roleModalShown,
      isPlayerDead
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Varela+Round:wght@400;500;700;900&display=swap');

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  background: #000000;
  margin: 0;
  padding: 0;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  overflow-x: hidden;
}

/* Zapobiega scrollowaniu poziomemu */
html, body {
  max-width: 100vw;
}

#app {
  font-family: 'Varela Round', 'Courier New', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #ffffff;
  padding: 0;
  background: #000000;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  box-sizing: border-box;
}

.tab-container {
  width: 100%;
  margin: 0;
  background: #1e1e2e;
  border-radius: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  border: 2px solid #2d2d3f;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  background: #000000;
  border-bottom: 2px solid #ff6b6b;
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.tab-header::-webkit-scrollbar {
  height: 2px;
}

.tab-header::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.tab-header::-webkit-scrollbar-thumb {
  background: #4ecdc4;
  border-radius: 1px;
}

.tab-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.tab-button {
  flex: 1 0 auto;
  padding: 12px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: #b8b8d4;
  transition: all 0.3s ease;
  font-family: 'Varela Round', monospace;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  min-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tab-button:hover {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.tab-button:hover::before {
  opacity: 1;
}

.tab-button.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: #ffffff;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.tab-content {
  padding: 20px 15px;
  flex: 1;
  background: #000000;
  overflow-y: auto;
}

.tab-panel h2 {
  margin: 0 0 20px 0;
  color: #ffffff;
  text-align: center;
  font-size: 24px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.6);
  font-family: 'Varela Round', monospace;
}

/* Admin Panel Styles - Among Us Theme */
.login-section {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 15px;
  border: 2px solid #ff6b6b;
  border-radius: 15px;
  background: linear-gradient(135deg, #2d2d3f 0%, #3d3d5f 100%);
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.login-section h3 {
  color: #ff6b6b;
  text-align: center;
  font-family: 'Varela Round', monospace;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
  margin-bottom: 25px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-content {
  max-width: 100%;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 15px;
  padding: 15px;
  border-bottom: 2px solid #4ecdc4;
  margin-bottom: 20px;
  background: linear-gradient(90deg, rgba(78, 205, 196, 0.1), rgba(255, 107, 107, 0.1));
  border-radius: 10px;
}

.admin-header span {
  color: #4ecdc4;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(78, 205, 196, 0.6);
}

.section {
  margin-bottom: 25px;
  padding: 15px;
  border: 2px solid #4ecdc4;
  border-radius: 15px;
  background: linear-gradient(135deg, #2d2d3f 0%, #3a3a52 100%);
  box-shadow: 0 8px 25px rgba(78, 205, 196, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
}

.section::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: linear-gradient(45deg, #4ecdc4, #45b7d1, #96ceb4, #4ecdc4);
  border-radius: 15px;
  z-index: -1;
  opacity: 0.3;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #4ecdc4;
  font-size: 18px;
  font-family: 'Varela Round', monospace;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 15px rgba(78, 205, 196, 0.8);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #96ceb4;
  font-family: 'Varela Round', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 14px;
  text-shadow: 0 0 8px rgba(150, 206, 180, 0.6);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #45b7d1;
  border-radius: 10px;
  font-size: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d3f 100%);
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.5),
              inset 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #2d2d3f 0%, #3a3a52 100%);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #7a7a9e;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  font-family: 'Varela Round', monospace;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.settings-form,
.task-form {
  margin-top: 25px;
}

.task-form h4 {
  margin: 0 0 20px 0;
  color: #96ceb4;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(150, 206, 180, 0.6);
}

.btn {
  padding: 12px 20px;
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  display: block;
  width: 100%;
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 10px;
  font-family: 'Varela Round', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  min-height: 44px;
  box-sizing: border-box;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.btn-primary {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: #ffffff;
  border-color: #4ecdc4;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5fd4cb 0%, #4db0a0 100%);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
  transform: translateY(-2px);
}

.btn-secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-color: #667eea;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #7289f1 0%, #8357b3 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.btn-success {
  background: linear-gradient(135deg, #96ceb4 0%, #66bb6a 100%);
  color: #ffffff;
  border-color: #96ceb4;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #a5d8c1 0%, #73c677 100%);
  box-shadow: 0 6px 20px rgba(150, 206, 180, 0.4);
  transform: translateY(-2px);
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: #ffffff;
  border-color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7878 0%, #f16659 100%);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  transform: translateY(-2px);
}

.btn-warning {
  background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
  color: #2d3436;
  border-color: #f9ca24;
  text-shadow: 0 0 10px rgba(45, 52, 54, 0.8);
}

.btn-warning:hover:not(:disabled) {
  background: linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%);
  box-shadow: 0 6px 20px rgba(249, 202, 36, 0.4);
  transform: translateY(-2px);
}

.btn-info {
  background: linear-gradient(135deg, #45b7d1 0%, #3498db 100%);
  color: #ffffff;
  border-color: #45b7d1;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.btn-info:hover:not(:disabled) {
  background: linear-gradient(135deg, #52c4de 0%, #3ba0e8 100%);
  box-shadow: 0 6px 20px rgba(69, 183, 209, 0.4);
  transform: translateY(-2px);
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 20px;
}

.game-controls,
.players-controls,
.tasks-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.players-list,
.tasks-list {
  margin-top: 25px;
}

.player-item,
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border: 2px solid #45b7d1;
  border-radius: 15px;
  margin-bottom: 15px;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d3f 100%);
  box-shadow: 0 4px 15px rgba(69, 183, 209, 0.2);
  transition: all 0.3s ease;
}

.player-item:hover,
.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(69, 183, 209, 0.3);
  border-color: #4ecdc4;
}

.player-name {
  font-weight: 700;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.player-role {
  color: #96ceb4;
  font-size: 14px;
  font-family: 'Varela Round', monospace;
  font-weight: 500;
  text-transform: uppercase;
  background: linear-gradient(135deg, #96ceb4, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.player-role-hidden {
  color: #666666;
  font-size: 14px;
  font-family: 'Varela Round', monospace;
  font-weight: 500;
  text-transform: uppercase;
  font-style: italic;
  background: linear-gradient(135deg, #666666, #444444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.task-info {
  flex: 1;
}

.task-info h5 {
  margin: 0 0 8px 0;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.task-location,
.task-description {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #b8b8d4;
  font-family: 'Varela Round', monospace;
}

.task-location {
  font-weight: 600;
  color: #4ecdc4;
  text-transform: uppercase;
}

.task-description {
  font-weight: 400;
  line-height: 1.4;
}

.no-data {
  text-align: center;
  color: #7a7a9e;
  font-style: italic;
  padding: 30px;
  font-family: 'Varela Round', monospace;
  font-size: 16px;
  background: linear-gradient(135deg, #2d2d3f 0%, #3a3a52 100%);
  border: 2px dashed #45b7d1;
  border-radius: 15px;
  opacity: 0.8;
}

.message {
  position: fixed;
  top: max(25px, calc(env(safe-area-inset-top) + 10px));
  right: max(25px, calc(env(safe-area-inset-right) + 10px));
  left: 15px;
  padding: 15px 20px;
  border-radius: 15px;
  color: #ffffff;
  font-weight: 700;
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  font-family: 'Varela Round', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid transparent;
  backdrop-filter: blur(10px);
  text-align: center;
  font-size: 14px;
}

.message.success {
  background: linear-gradient(135deg, #96ceb4 0%, #66bb6a 100%);
  border-color: #96ceb4;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.message.error {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border-color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.error {
  color: #ff6b6b;
  margin-top: 12px;
  font-size: 14px;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(255, 107, 107, 0.6);
}


/* Mobile-First Design - Among Us Style */

/* Dodatkowo na bardzo małych ekranach */
@media (max-width: 360px) {
  #app {
    padding: 0;
  }
  
  .tab-button {
    padding: 8px 4px;
    font-size: 11px;
    letter-spacing: 0.2px;
    min-width: 0;
  }
  
  .tab-panel h2 {
    font-size: 20px;
  }
  
  .section h3 {
    font-size: 16px;
  }
  
  .login-section h3 {
    font-size: 18px;
  }
  
  .btn {
    padding: 10px 15px;
    font-size: 13px;
    min-height: 40px;
  }
  
  .form-group input,
  .form-group textarea {
    padding: 10px 12px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .player-item,
  .task-item {
    padding: 12px 15px;
  }
  
  .message {
    padding: 12px 15px;
    font-size: 12px;
  }
}

/* PANIC Button Styles */
.panic-section {
  position: relative;
  margin-bottom: 30px;
  padding: 20px;
  text-align: center;
}

.panic-container {
  position: relative;
  display: inline-block;
}

.btn-panic {
  font-family: 'Varela Round', monospace;
  font-size: 28px;
  font-weight: 900;
  padding: 25px 50px;
  border: 4px solid #ff6b6b;
  border-radius: 25px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
  color: #ffffff;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 30px rgba(255, 107, 107, 0.6),
              0 8px 25px rgba(0, 0, 0, 0.4),
              inset 0 2px 8px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: panic-pulse 2s ease-in-out infinite;
  width: 100%;
  max-width: 400px;
}

@keyframes panic-pulse {
  0%, 100% {
    box-shadow: 0 0 30px rgba(255, 107, 107, 0.6),
                0 8px 25px rgba(0, 0, 0, 0.4),
                inset 0 2px 8px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 50px rgba(255, 107, 107, 0.8),
                0 12px 35px rgba(0, 0, 0, 0.5),
                inset 0 2px 8px rgba(255, 255, 255, 0.3);
  }
}

.btn-panic::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.btn-panic:hover::before {
  left: 100%;
}

.btn-panic:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 0 50px rgba(255, 107, 107, 0.8),
              0 15px 40px rgba(0, 0, 0, 0.5),
              inset 0 2px 8px rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #ff7675 0%, #fd79a8 100%);
}

.btn-panic:active {
  transform: translateY(-1px) scale(1.02);
}

.btn-panic:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  animation: none;
  transform: none;
}

/* End Meeting Button Styles */
.btn-end-meeting {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  color: #ffffff;
  border: none;
  border-radius: 15px;
  padding: 20px 30px;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 184, 148, 0.6),
              0 8px 25px rgba(0, 0, 0, 0.4),
              inset 0 2px 8px rgba(255, 255, 255, 0.2);
  animation: end-meeting-pulse 2s ease-in-out infinite;
  width: 100%;
  max-width: 400px;
}

@keyframes end-meeting-pulse {
  0%, 100% {
    box-shadow: 0 0 30px rgba(0, 184, 148, 0.6),
                0 8px 25px rgba(0, 0, 0, 0.4),
                inset 0 2px 8px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 50px rgba(0, 184, 148, 0.8),
                0 12px 35px rgba(0, 0, 0, 0.5),
                inset 0 2px 8px rgba(255, 255, 255, 0.3);
  }
}

.btn-end-meeting::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.btn-end-meeting:hover::before {
  left: 100%;
}

.btn-end-meeting:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 0 50px rgba(0, 184, 148, 0.8),
              0 15px 40px rgba(0, 0, 0, 0.5),
              inset 0 2px 8px rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #00cec9 0%, #00b894 100%);
}

.btn-end-meeting:active {
  transform: translateY(-1px) scale(1.02);
}

.btn-end-meeting:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  animation: none;
  transform: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d3f 100%);
  border: 3px solid #4ecdc4;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8),
              0 0 40px rgba(78, 205, 196, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #4ecdc4;
  background: linear-gradient(135deg, #2d2d3f 0%, #3a3a52 100%);
  border-radius: 17px 17px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #4ecdc4;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 15px rgba(78, 205, 196, 0.8);
}

.close-btn {
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 30px;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  font-weight: bold;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ffffff;
  transform: scale(1.1);
}

.modal-body {
  padding: 25px;
}

.loading-text {
  text-align: center;
  color: #4ecdc4;
  font-family: 'Varela Round', monospace;
  font-size: 16px;
  padding: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.no-players {
  text-align: center;
  color: #7a7a9e;
  font-family: 'Varela Round', monospace;
  font-size: 16px;
  padding: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.players-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.player-panic-btn {
  padding: 15px 20px;
  border: 2px solid #4ecdc4;
  border-radius: 15px;
  background: linear-gradient(135deg, #2d2d3f 0%, #3a3a52 100%);
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.2);
}

.player-panic-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(78, 205, 196, 0.3), transparent);
  transition: left 0.5s ease;
}

.player-panic-btn:hover::before {
  left: 100%;
}

.player-panic-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border-color: #4ecdc4;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(78, 205, 196, 0.4);
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.player-panic-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Mobile optimizations for panic functionality */
@media (max-width: 480px) {
  .tab-container {
    width: 100%;
  }
  
  .tab-button {
    padding: 10px 6px;
    font-size: 12px;
    letter-spacing: 0.3px;
  }
  
  .btn-panic {
    font-size: 20px;
    padding: 20px 30px;
    letter-spacing: 2px;
  }
  
  .modal-overlay {
    padding: 15px;
  }
  
  .modal-header h3 {
    font-size: 16px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .player-panic-btn {
    padding: 12px 15px;
    font-size: 14px;
  }
}

/* Medium phones and small tablets */
@media (min-width: 481px) and (max-width: 767px) {
  .tab-button {
    padding: 12px 10px;
    font-size: 13px;
    letter-spacing: 0.4px;
  }
}

/* Tablet landscape i większe telefony */
@media (min-width: 768px) {
  #app {
    padding: 0;
  }
  
  .tab-container {
    width: 100%;
  }
  
  .tab-content {
    padding: 25px 20px;
  }
  
  .tab-button {
    padding: 14px 16px;
    font-size: 15px;
    letter-spacing: 0.8px;
  }
  
  .btn {
    display: inline-block;
    width: auto;
    margin-right: 10px;
    padding: 14px 25px;
    font-size: 15px;
  }
  
  .game-controls,
  .players-controls,
  .tasks-controls {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .admin-header {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
  
  .section {
    padding: 20px;
    margin-bottom: 30px;
  }
    
  .section h3 {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .players-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .btn-panic {
    font-size: 32px;
    padding: 30px 60px;
    letter-spacing: 4px;
  }
}

/* Very large screens */
@media (min-width: 1024px) {
  .tab-container {
    width: 100%;
  }
  
  .tab-button {
    padding: 16px 20px;
    font-size: 16px;
    letter-spacing: 1px;
  }
}

/* Player Registration Styles */
.player-registration {
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #00ff41;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
}

.registration-form h3,
.player-status h3 {
  color: #00ff41;
  text-shadow: 0 0 10px #00ff41;
  margin-bottom: 15px;
}

.registration-form p {
  color: #ffffff;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.player-name-input {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ff41;
  border-radius: 8px;
  padding: 12px 15px;
  color: #00ff41;
  font-family: 'Varela Round', monospace;
  font-size: 16px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  transition: all 0.3s ease;
}

.player-name-input:focus {
  outline: none;
  box-shadow: 0 0 15px #00ff41;
  background: rgba(0, 255, 65, 0.1);
}

.player-name-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-register {
  background: linear-gradient(45deg, #00ff41, #00cc33);
  border: none;
  border-radius: 8px;
  padding: 12px 25px;
  color: #000000;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 150px;
}

.btn-register:hover:not(:disabled) {
  background: linear-gradient(45deg, #00cc33, #009926);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 65, 0.3);
}

.btn-register:disabled {
  background: #666;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.player-status {
  text-align: center;
}

.player-status p {
  color: #ffffff;
  margin: 15px 0;
  font-size: 16px;
}

.btn-unregister {
  background: linear-gradient(45deg, #ff4444, #cc0000);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.btn-unregister:hover {
  background: linear-gradient(45deg, #cc0000, #990000);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 68, 68, 0.3);
}

.game-active-status {
  background: rgba(255, 68, 68, 0.1);
  border: 2px solid #ff4444;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
}

.game-active-status h3 {
  color: #ff4444;
  text-shadow: 0 0 10px #ff4444;
  margin-bottom: 15px;
}

.game-active-status p {
  color: #ffffff;
  margin: 10px 0;
}

.player-info {
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid #00ff41;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.player-info p {
  color: #00ff41;
  font-weight: 600;
  margin: 0;
}

@media (min-width: 768px) {
  .form-group {
    flex-direction: row;
    justify-content: center;
  }
  
  .player-name-input {
    max-width: 250px;
  }
}

/* O2 System Management Styles */
.o2-management {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #ff6b35;
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
}

.o2-status {
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 107, 53, 0.1);
  border-radius: 8px;
  border: 1px solid #ff6b35;
}

.o2-status p {
  margin: 10px 0;
  color: #ffffff;
  font-size: 14px;
}

.o2-status strong {
  color: #ff6b35;
}

.status-inactive {
  color: #666666;
  font-weight: 600;
}

.status-ready {
  color: #00ff41;
  font-weight: 600;
  text-shadow: 0 0 5px #00ff41;
}

.status-first {
  color: #00bfff;
  font-weight: 600;
  text-shadow: 0 0 5px #00bfff;
}

.status-second {
  color: #ff41ff;
  font-weight: 600;
  text-shadow: 0 0 5px #ff41ff;
}

.tab-available {
  color: #00ff41;
  font-weight: 600;
  margin: 0 10px;
  padding: 2px 8px;
  background: rgba(0, 255, 65, 0.2);
  border-radius: 4px;
  border: 1px solid #00ff41;
}

.tab-locked {
  color: #ff4444;
  font-style: italic;
  font-size: 12px;
}

.btn-o2-clear {
  width: 100%;
  margin: 15px 0;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(45deg, #ff4444, #cc0000);
  border: 2px solid #ff4444;
  transition: all 0.3s ease;
}

.btn-o2-clear:hover:not(:disabled) {
  background: linear-gradient(45deg, #ff6666, #ff0000);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 68, 68, 0.4);
  border-color: #ff6666;
}

.btn-o2-clear:disabled {
  background: #666;
  border-color: #666;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.o2-warning {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid #ff4444;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.o2-warning p {
  color: #ff4444;
  font-size: 14px;
  margin: 5px 0;
}

.o2-warning ul {
  margin: 10px 0 0 20px;
  padding: 0;
}

.o2-warning li {
  color: #ffffff;
  font-size: 13px;
  margin: 5px 0;
  list-style-type: disc;
}

@media (max-width: 768px) {
  .o2-management {
    padding: 15px;
  }
  
  .o2-status {
    padding: 12px;
  }
  
  .btn-o2-clear {
    font-size: 14px;
    padding: 10px 15px;
  }
}

/* Game Login & Game View Styles */
.game-active-section {
  margin: 20px 0;
}

.game-login {
  background: rgba(0, 100, 255, 0.1);
  border: 2px solid #0064ff;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}

.game-login h3 {
  color: #0064ff;
  text-shadow: 0 0 10px #0064ff;
  margin-bottom: 15px;
}

.game-login p {
  color: #ffffff;
  margin-bottom: 20px;
}

.btn-login {
  background: linear-gradient(45deg, #0064ff, #0040cc);
  border: none;
  border-radius: 8px;
  padding: 12px 25px;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 180px;
}

.btn-login:hover:not(:disabled) {
  background: linear-gradient(45deg, #0080ff, #0064ff);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 100, 255, 0.3);
}

.btn-login:disabled {
  background: #666;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.game-login-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 100, 255, 0.05);
  border: 1px solid #0064ff;
  border-radius: 8px;
}

.game-login-info p {
  margin: 0;
  font-size: 14px;
  color: #ffffff;
}

.game-view {
  background: rgba(0, 255, 100, 0.1);
  border: 2px solid #00ff64;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
}

.game-view h3 {
  color: #00ff64;
  text-shadow: 0 0 10px #00ff64;
  margin-bottom: 20px;
  text-align: center;
}

.game-interface {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #00ff64;
  border-radius: 8px;
  padding: 20px;
}

.game-interface p {
  color: #00ff64;
  font-weight: 600;
  margin-bottom: 15px;
}

.game-content {
  background: rgba(0, 255, 100, 0.05);
  border: 1px solid #00ff64;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.game-content p {
  color: #ffffff;
  font-size: 18px;
  margin: 0;
  font-style: italic;
}

@media (max-width: 768px) {
  .game-login,
  .game-view {
    padding: 15px;
    margin: 15px 0;
  }
  
  .game-interface {
    padding: 15px;
  }
  
  .btn-login {
    font-size: 14px;
    padding: 10px 20px;
    min-width: 150px;
  }
  
  .game-login-info {
    padding: 12px;
  }
}

/* VITALS - Hospital Style */
.vitals-section {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 3px solid #28a745;
  border-radius: 15px;
  padding: 25px;
  margin: 30px 0;
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.15);
  position: relative;
}

.vitals-section::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #28a745, #20c997, #28a745);
  border-radius: 15px;
  z-index: -1;
  animation: vitals-pulse 3s ease-in-out infinite;
}

@keyframes vitals-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.vitals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #28a745;
}

.vitals-header h3 {
  color: #155724;
  font-family: 'Varela Round', monospace;
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(21, 87, 36, 0.3);
}

.vitals-status {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(40, 167, 69, 0.1);
  padding: 8px 15px;
  border-radius: 20px;
  border: 1px solid #28a745;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
}

.status-indicator.online {
  background: #28a745;
  box-shadow: 0 0 10px #28a745;
  animation: pulse-green 2s ease-in-out infinite;
}

@keyframes pulse-green {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.status-text {
  color: #155724;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.vitals-container {
  background: #ffffff;  
  border: 2px solid #dee2e6;
  border-radius: 10px;
  padding: 20px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.vitals-card {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border: 2px solid #28a745;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.vitals-card.deceased {
  border-color: #dc3545;
  background: linear-gradient(135deg, #fff5f5, #ffeaea);
}

.vitals-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(40, 167, 69, 0.2);
}

.vitals-card.deceased:hover {
  box-shadow: 0 8px 20px rgba(220, 53, 69, 0.2);
}

.vitals-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.patient-id {
  background: #6c757d;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
}

.vital-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Varela Round', monospace;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.vital-status.alive {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.vital-status.dead {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.patient-info {
  margin-bottom: 15px;
}

.patient-name {
  font-size: 18px;
  font-weight: 700;
  color: #495057;
  font-family: 'Varela Round', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.vital-signs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vital-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.02);
  padding: 5px 10px;
  border-radius: 4px;
  border-left: 3px solid #28a745;
}

.vital-label {
  font-family: 'Varela Round', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.vital-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #28a745;
}

.vital-value.flatline {
  color: #dc3545;
  animation: blink-red 1.5s ease-in-out infinite;
}

.vital-value.critical {
  color: #dc3545;
  font-weight: 900;
}

@keyframes blink-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.vitals-chart {
  height: 40px;
  background: #000000;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  border: 1px solid #28a745;
}

.ecg-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #28a745;
  transform: translateY(-50%);
}

.ecg-line:before {
  content: "";
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 24px;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 10px,
    #28a745 10px,
    #28a745 12px,
    transparent 12px,
    transparent 15px,
    #28a745 15px,
    #28a745 25px,
    transparent 25px,
    transparent 50px
  );
  animation: ecg-beat 2s linear infinite;
}

.ecg-line.flatline {
  background: #dc3545;
}

.ecg-line.flatline:before {
  background: #dc3545;
  animation: none;
}

@keyframes ecg-beat {
  0% { transform: translateX(-50px); }
  100% { transform: translateX(100%); }
}

.no-vitals {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.no-vitals-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.medical-cross {
  font-size: 48px;
  color: #28a745;
  text-shadow: 2px 2px 4px rgba(40, 167, 69, 0.3);
}

.no-vitals p {
  font-family: 'Varela Round', monospace;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.no-vitals small {
  font-family: 'Varela Round', monospace;
  font-size: 12px;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .vitals-section {
    padding: 15px;
    margin: 20px 0;
  }
  
  .vitals-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .vitals-header h3 {
    font-size: 20px;
  }
  
  .vitals-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .vitals-card {
    padding: 12px;
  }
  
  .patient-name {
    font-size: 16px;
  }
  
  .vital-line {
    padding: 4px 8px;
  }
  
  .vitals-chart {
    height: 30px;
  }
}

/* Oxygen System Styles */
.oxygen-alert {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 3px solid #fd7e14;
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 8px 25px rgba(253, 126, 20, 0.25);
  animation: oxygen-pulse 2s ease-in-out infinite;
}

@keyframes oxygen-pulse {
  0%, 100% { 
    border-color: #fd7e14;
    box-shadow: 0 8px 25px rgba(253, 126, 20, 0.25);
  }
  50% { 
    border-color: #dc3545;
    box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
  }
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.alert-icon {
  font-size: 32px;
  animation: shake 1s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.alert-header h3 {
  color: #d9534f;
  font-family: 'Varela Round', monospace;
  font-size: 24px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(217, 83, 79, 0.3);
}

.alert-message {
  color: #8a6d3b;
  font-family: 'Varela Round', monospace;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(139, 69, 19, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d9534f;
}

.oxygen-controls {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 2px solid #007bff;
  border-radius: 12px;
  padding: 25px;
  margin: 20px 0;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.15);
}

.btn-restore-oxygen {
  background: linear-gradient(45deg, #28a745, #20c997);
  border: 3px solid #28a745;
  border-radius: 12px;
  padding: 15px 30px;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(40, 167, 69, 0.3);
  min-width: 250px;
}

.btn-restore-oxygen:hover:not(:disabled) {
  background: linear-gradient(45deg, #218838, #1e7e34);
  border-color: #1e7e34;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(40, 167, 69, 0.4);
}

.btn-restore-oxygen:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
}

.btn-restore-oxygen.inactive,
.btn-restore-oxygen:disabled {
  background: linear-gradient(45deg, #6c757d, #495057);
  border-color: #6c757d;
  color: #adb5bd;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
}

.oxygen-status-normal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  background: rgba(40, 167, 69, 0.1);
  border: 2px solid #28a745;
  border-radius: 8px;
  color: #155724;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-icon {
  font-size: 20px;
}

.oxygen-status-normal .status-icon {
  animation: pulse-green-slow 3s ease-in-out infinite;
}

@keyframes pulse-green-slow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@media (max-width: 768px) {
  .oxygen-alert {
    padding: 15px;
    margin: 15px 0;
  }
  
  .alert-header h3 {
    font-size: 20px;
  }
  
  .alert-message {
    font-size: 14px;
    padding: 10px;
  }
  
  .oxygen-controls {
    padding: 20px;
    margin: 15px 0;
  }
  
  .btn-restore-oxygen {
    padding: 12px 20px;
    font-size: 16px;
    min-width: 200px;
  }
  
  .oxygen-status-normal {
    padding: 12px;
    flex-direction: column;
    gap: 8px;
  }
}

/* Game View Styles */
.game-actions {
  margin: 25px 0;
}

.game-actions h4 {
  color: #0d6efd;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Varela Round', monospace;
  position: relative;
  overflow: hidden;
  padding: 0;
}

.main-panel-map {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Varela Round', monospace;
  position: absolute;
  left: -120px;
  top: 50%;
  transform: translateY(-50%);
  overflow: hidden;
  padding: 0;
}

.action-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.action-btn .btn-icon {
  font-size: 24px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn .btn-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.action-btn .btn-text {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  text-align: center;
  line-height: 1.1;
}

/* Player Tasks Styles - Dark Theme */
.player-tasks {
  margin: 30px 0;
  padding: 25px;
  background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
  border: 3px solid #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
}

.player-tasks h4 {
  color: #00d4ff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  margin-bottom: 25px;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-bottom: 3px solid #00d4ff;
  padding-bottom: 12px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.tasks-loading, .no-tasks {
  text-align: center;
  padding: 30px 20px;
  color: #e0e0e0;
  font-style: italic;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.tasks-loading p, .no-tasks p {
  font-size: 16px;
  margin: 0;
  color: #00d4ff;
  font-weight: 600;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

/* Task Bar Styles - Dark Theme */
.task-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.task-bar.completed .task-bar-content {
  background: linear-gradient(90deg, #1a4d1a, #0d3d0d);
  border-color: #28a745;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.task-bar-content {
  display: flex;
  align-items: center;
  min-height: 50px;
  background: linear-gradient(90deg, #1a1a1a, #2d2d2d);
  border: 2px solid #ffffff;
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  flex: 1;
}

.task-bar-content:hover {
  border-color: #00d4ff;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
  transform: translateY(-2px);
}

.task-complete-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  border: 2px solid #ffffff;
  color: white;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  flex-shrink: 0;
}

.task-complete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1e7e34);
  border-color: #00ff88;
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5);
  transform: scale(1.05) translateY(-2px);
}

.task-complete-btn:disabled {
  background: #666;
  border-color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 15px;
  flex-grow: 1;
}

.task-title {
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.task-location {
  color: #00d4ff;
  font-weight: 500;
  font-size: 13px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 15px;
}

.task-status {
  font-size: 20px;
  flex-shrink: 0;
}





.tasks-refresh {
  width: 100%;
  margin-top: 20px;
  padding: 15px 25px;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a1a1a, #333333);
  border: 2px solid #00d4ff;
  color: #00d4ff;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.tasks-refresh:hover:not(:disabled) {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #000000;
  border-color: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
  transform: translateY(-2px);
}

.tasks-refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
  border-color: #666666;
  color: #666666;
}

/* Responsive Design for Game View */
@media (max-width: 768px) {
  .action-buttons {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .action-btn {
    width: 70px;
    height: 70px;
  }
  
  .action-btn .btn-icon {
    font-size: 20px;
  }
  
  .action-btn .btn-text {
    font-size: 9px;
  }
  
  .player-tasks {
    padding: 15px;
    margin: 20px 0;
  }
  
  .task-bar {
    margin-bottom: 6px;
    gap: 6px;
  }
  
  .task-bar-content {
    min-height: 45px;
  }
  
  .task-complete-btn {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
  
  .task-info {
    padding: 6px 12px;
  }
  
  .task-title {
    font-size: 14px;
  }
  
  .task-location {
    font-size: 12px;
  }
  
  .task-actions {
    padding: 6px 12px;
  }
  
  .description-content {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .task-bar {
    gap: 4px;
  }
  
  .action-buttons {
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  
  .action-btn {
    width: 60px;
    height: 60px;
  }
  
  .action-btn .btn-icon {
    font-size: 16px;
  }
  
  .action-btn .btn-text {
    font-size: 7px;
  }
  
  .task-complete-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .task-info {
    padding: 5px 10px;
    gap: 2px;
  }
  
  .task-title {
    font-size: 13px;
  }
  
  .task-location {
    font-size: 11px;
  }
  
  .task-actions {
    padding: 5px 10px;
  }
  
  .description-content {
    padding: 12px;
  }
  
  .description-content h6 {
    font-size: 12px;
  }
  
  .description-content p {
    font-size: 12px;
  }
}

/* Game Status Indicator Styles */
.game-status-indicator {
  margin: 20px 0;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 15px 25px;
  border-radius: 12px;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 16px;
  border: 3px solid;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  min-width: 220px;
}

.status-badge.active {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #28a745;
  color: #155724;
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
}

.status-badge.active .status-icon {
  animation: pulse-green-badge 2s ease-in-out infinite;
}

.status-badge.inactive {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-color: #dc3545;
  color: #721c24;
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
}

.status-badge.inactive .status-icon {
  animation: pulse-red-badge 2s ease-in-out infinite;
}

.status-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.status-text {
  font-weight: 900;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

@keyframes pulse-green-badge {
  0%, 100% { 
    transform: scale(1); 
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.1); 
    filter: brightness(1.2);
  }
}

@keyframes pulse-red-badge {
  0%, 100% { 
    transform: scale(1); 
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.1); 
    filter: brightness(1.2);
  }
}

@media (max-width: 768px) {
  .status-badge {
    padding: 12px 20px;
    font-size: 14px;
    min-width: 180px;
    gap: 10px;
  }
  
  .status-icon {
    font-size: 18px;
  }
}

/* Tasks Progress Bar Styles - Dark Theme */
.tasks-progress {
  margin: 20px 0 25px 0;
  padding: 20px;
  background: linear-gradient(135deg, #0f0f0f, #2a2a2a);
  border: 2px solid #00d4ff;
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 212, 255, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-family: 'Varela Round', monospace;
}

.progress-label {
  font-weight: 600;
  color: #ffffff;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.progress-percentage {
  font-weight: 700;
  color: #00ff88;
  font-size: 16px;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.progress-bar {
  width: 100%;
  height: 22px;
  background: linear-gradient(135deg, #1a1a1a, #0d0d0d);
  border: 2px solid #333333;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.8);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00d4ff, #88ff00);
  border-radius: 13px;
  transition: all 0.6s ease-in-out;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: progress-glow 2s ease-in-out infinite alternate;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progress-shine 3s ease-in-out infinite;
}

@keyframes progress-glow {
  0% {
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  100% {
    box-shadow: 0 0 25px rgba(0, 255, 136, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Progress completion states */
.progress-fill[style*="100%"] {
  background: linear-gradient(90deg, #00ff88, #00d4ff, #ffff00);
  animation: progress-complete 1s ease-in-out;
}

@keyframes progress-complete {
  0%, 100% {
    background: linear-gradient(90deg, #00ff88, #00d4ff, #88ff00);
  }
  50% {
    background: linear-gradient(90deg, #ffff00, #ff8800, #ff0088);
  }
}

/* Responsive design for progress bar */
@media (max-width: 768px) {
  .tasks-progress {
    padding: 12px;
    margin: 15px 0 20px 0;
  }
  
  .progress-info {
    gap: 8px;
    text-align: center;
  }
  
  .progress-label {
    font-size: 13px;
  }
  
  .progress-percentage {
    font-size: 15px;
  }
  
  .progress-bar {
    height: 16px;
  }
}

@media (max-width: 480px) {
  .progress-label {
    font-size: 12px;
  }
  
  .progress-percentage {
    font-size: 14px;
  }
  
  .progress-bar {
    height: 14px;
  }
}

/* Victory Modal Styles */
.victory-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.victory-modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 2px solid #00d4ff;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  animation: slideIn 0.4s ease-out;
}

.victory-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #00d4ff;
}

.victory-modal-header h2 {
  color: #00d4ff;
  margin: 0;
  font-size: 24px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.victory-modal-close {
  background: none;
  border: none;
  color: #00d4ff;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.victory-modal-close:hover {
  background: rgba(0, 212, 255, 0.2);
  transform: scale(1.1);
}

.victory-modal-content {
  margin-bottom: 25px;
}

.victory-icon {
  font-size: 60px;
  margin-bottom: 15px;
  animation: bounce 2s infinite;
}

.victory-modal-content h3 {
  color: #ffffff;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.winning-team {
  background: linear-gradient(45deg, #00ff88, #00d4ff);
  color: #1a1a2e;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 20px;
  font-weight: bold;
  margin: 15px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
  animation: glow 2s ease-in-out infinite alternate;
}

.victory-message {
  color: #cccccc;
  margin: 15px 0 0 0;
  font-size: 16px;
}

/* Impostors section styles */
.impostors-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 212, 255, 0.3);
}

.impostors-section h4 {
  color: #ff6b6b;
  margin: 0 0 12px 0;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(255, 107, 107, 0.5);
}

.impostors-list {
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.4);
  border: 1px solid rgba(255, 107, 107, 0.3);
  animation: impostorGlow 2s ease-in-out infinite alternate;
}

.victory-modal-footer {
  text-align: center;
}

.victory-modal-footer .btn {
  background: linear-gradient(45deg, #00d4ff, #00ff88);
  color: #1a1a2e;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.victory-modal-footer .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
  }
  to {
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.8), 0 0 40px rgba(0, 212, 255, 0.6);
  }
}

@keyframes impostorGlow {
  from {
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.4);
  }
  to {
    box-shadow: 0 0 25px rgba(255, 107, 107, 0.8), 0 0 35px rgba(238, 90, 82, 0.6);
  }
}

/* Responsive design for victory modal */
@media (max-width: 768px) {
  .victory-modal {
    padding: 20px;
    margin: 20px;
  }
  
  .victory-modal-header h2 {
    font-size: 20px;
  }
  
  .victory-icon {
    font-size: 50px;
  }
  
  .winning-team {
    font-size: 18px;
    padding: 12px 20px;
  }
  
  .impostors-section h4 {
    font-size: 15px;
  }
  
  .impostors-list {
    font-size: 15px;
    padding: 10px 15px;
  }
}

@media (max-width: 480px) {
  .victory-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .victory-modal-header h2 {
    font-size: 18px;
  }
  
  .victory-icon {
    font-size: 40px;
  }
  
  .winning-team {
    font-size: 16px;
    padding: 10px 15px;
  }
  
  .impostors-section h4 {
    font-size: 14px;
  }
  
  .impostors-list {
    font-size: 14px;
    padding: 8px 12px;
  }
}

/* Kill Confirmation Modal Styles */
.kill-confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.kill-confirm-modal {
  background: linear-gradient(135deg, #2d1b2e, #1a1a2e);
  border: 2px solid #ff6b6b;
  border-radius: 15px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
  animation: slideIn 0.4s ease-out;
}

.kill-confirm-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ff6b6b;
}

.kill-confirm-modal-header h2 {
  color: #ff6b6b;
  margin: 0;
  font-size: 22px;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.kill-confirm-modal-close {
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.kill-confirm-modal-close:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.1);
}

.kill-confirm-modal-content {
  margin-bottom: 25px;
}

.kill-icon {
  font-size: 50px;
  margin-bottom: 15px;
  animation: killPulse 2s infinite;
}

.kill-confirm-modal-content h3 {
  color: #ffffff;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.kill-warning {
  color: #ffcccb;
  margin: 15px 0 0 0;
  font-size: 14px;
  line-height: 1.4;
}

.kill-confirm-modal-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.kill-confirm-modal-footer .btn {
  padding: 10px 25px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
}

.kill-confirm-modal-footer .btn-secondary {
  background: linear-gradient(45deg, #6c757d, #495057);
  color: #ffffff;
}

.kill-confirm-modal-footer .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
}

.kill-confirm-modal-footer .btn-danger {
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  color: #ffffff;
}

.kill-confirm-modal-footer .btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
}

.kill-confirm-modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes killPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Responsive design for kill confirmation modal */
@media (max-width: 768px) {
  .kill-confirm-modal {
    padding: 20px;
    margin: 20px;
  }
  
  .kill-confirm-modal-header h2 {
    font-size: 20px;
  }
  
  .kill-icon {
    font-size: 40px;
  }
  
  .kill-confirm-modal-footer {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .kill-confirm-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .kill-confirm-modal-header h2 {
    font-size: 18px;
  }
  
  .kill-icon {
    font-size: 35px;
  }
  
  .kill-confirm-modal-content h3 {
    font-size: 16px;
  }
  
  .kill-warning {
    font-size: 13px;
  }
}

/* Report Confirmation Modal Styles */
.report-confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.report-confirm-modal {
  background: linear-gradient(135deg, #2e2d1b, #2e2a1a);
  border: 2px solid #ff9500;
  border-radius: 15px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 149, 0, 0.5);
  animation: slideIn 0.4s ease-out;
}

.report-confirm-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ff9500;
}

.report-confirm-modal-header h2 {
  color: #ff9500;
  margin: 0;
  font-size: 22px;
  text-shadow: 0 0 10px rgba(255, 149, 0, 0.5);
}

.report-confirm-modal-close {
  background: none;
  border: none;
  color: #ff9500;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.report-confirm-modal-close:hover {
  background: rgba(255, 149, 0, 0.2);
  transform: scale(1.1);
}

.report-confirm-modal-content {
  margin-bottom: 25px;
}

.report-icon {
  font-size: 50px;
  margin-bottom: 15px;
  animation: reportPulse 2s infinite;
}

.report-confirm-modal-content h3 {
  color: #ffffff;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.report-confirm-modal-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.report-confirm-modal-footer .btn {
  padding: 10px 25px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
}

.report-confirm-modal-footer .btn-secondary {
  background: linear-gradient(45deg, #6c757d, #495057);
  color: #ffffff;
}

.report-confirm-modal-footer .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
}

.report-confirm-modal-footer .btn-warning {
  background: linear-gradient(45deg, #ff9500, #e6851a);
  color: #ffffff;
}

.report-confirm-modal-footer .btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 149, 0, 0.4);
}

.report-confirm-modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes reportPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Responsive design for report confirmation modal */
@media (max-width: 768px) {
  .report-confirm-modal {
    padding: 20px;
    margin: 20px;
  }
  
  .report-confirm-modal-header h2 {
    font-size: 20px;
  }
  
  .report-icon {
    font-size: 40px;
  }
  
  .report-confirm-modal-footer {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .report-confirm-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .report-confirm-modal-header h2 {
    font-size: 18px;
  }
  
  .report-icon {
    font-size: 35px;
  }
  
  .report-confirm-modal-content h3 {
    font-size: 16px;
  }
}

/* Emergency Modal Styles */
.emergency-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: emergencyFadeIn 0.5s ease-in-out;
}

.emergency-modal {
  background: linear-gradient(135deg, #2d1b2e, #1a1a2e);
  border: 3px solid #ff6b6b;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 50px rgba(255, 107, 107, 0.7);
  animation: emergencySlideIn 0.6s ease-out;
}

.emergency-modal-header h2 {
  color: #ff6b6b;
  margin: 0 0 20px 0;
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
  animation: emergencyPulse 2s infinite;
}

.emergency-modal-content {
  margin-bottom: 20px;
}

.emergency-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: emergencyBounce 1.5s infinite;
}

.emergency-modal-content h3 {
  color: #ffffff;
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: bold;
}

.emergency-info {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 10px;
  padding: 15px;
  margin: 20px 0;
}

.emergency-info p {
  color: #ffcccb;
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.emergency-info strong {
  color: #ff6b6b;
  font-weight: bold;
}

.emergency-message {
  color: #ffffff;
  margin: 20px 0 0 0;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes emergencyFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes emergencySlideIn {
  from {
    transform: translateY(-100px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes emergencyPulse {
  0%, 100% {
    text-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
  }
  50% {
    text-shadow: 0 0 25px rgba(255, 107, 107, 1), 0 0 35px rgba(255, 107, 107, 0.6);
  }
}

@keyframes emergencyBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-7px);
  }
}

/* Responsive design for emergency modal */
@media (max-width: 768px) {
  .emergency-modal {
    padding: 30px;
    margin: 20px;
  }
  
  .emergency-modal-header h2 {
    font-size: 24px;
  }
  
  .emergency-icon {
    font-size: 60px;
  }
  
  .emergency-modal-content h3 {
    font-size: 20px;
  }
  
  .emergency-info p {
    font-size: 15px;
  }
  
  .emergency-message {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .emergency-modal {
    padding: 20px;
    margin: 15px;
  }
  
  .emergency-modal-header h2 {
    font-size: 20px;
  }
  
  .emergency-icon {
    font-size: 50px;
  }
  
  .emergency-modal-content h3 {
    font-size: 18px;
  }
  
  .emergency-info p {
    font-size: 14px;
  }
  
  .emergency-message {
    font-size: 15px;
  }
}

/* Map Modal Styles */
.map-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.map-modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 2px solid #4ecdc4;
  border-radius: 15px;
  padding: 30px;
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(78, 205, 196, 0.5);
  animation: slideIn 0.4s ease-out;
}

.map-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #4ecdc4;
}

.map-modal-header h2 {
  color: #4ecdc4;
  margin: 0;
  font-size: 24px;
  text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
}

.map-modal-close {
  background: none;
  border: none;
  color: #4ecdc4;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.map-modal-close:hover {
  background: rgba(78, 205, 196, 0.2);
  transform: scale(1.1);
}

.map-modal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Map Tabs */
.map-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(78, 205, 196, 0.3);
  padding-bottom: 10px;
}

.map-tab {
  background: linear-gradient(45deg, #2d2d3f, #3a3a52);
  color: #cccccc;
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.map-tab:hover {
  background: linear-gradient(45deg, #3a3a52, #4a4a62);
  color: #ffffff;
  border-color: rgba(78, 205, 196, 0.6);
  transform: translateY(-2px);
}

.map-tab.active {
  background: linear-gradient(45deg, #4ecdc4, #44a08d);
  color: #1a1a2e;
  border-color: #4ecdc4;
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.4);
}

/* Map Content */
.map-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 20px;
}

.map-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.map-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.map-modal-footer {
  margin-top: 20px;
  text-align: center;
  padding-top: 15px;
  border-top: 1px solid rgba(78, 205, 196, 0.3);
}

.map-modal-footer .btn {
  background: linear-gradient(45deg, #4ecdc4, #44a08d);
  color: #1a1a2e;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.map-modal-footer .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
}

/* Responsive design for map modal */
@media (max-width: 768px) {
  .map-modal {
    padding: 20px;
    margin: 20px;
    max-width: 95%;
  }
  
  .map-modal-header h2 {
    font-size: 20px;
  }
  
  .map-tabs {
    flex-direction: column;
    gap: 8px;
  }
  
  .map-tab {
    padding: 10px 15px;
    font-size: 13px;
  }
  
  .map-content {
    min-height: 300px;
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .map-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .map-modal-header h2 {
    font-size: 18px;
  }
  
  .map-tab {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .map-content {
    min-height: 250px;
    padding: 10px;
  }
}

/* Task Details Modal Styles */
.task-details-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.task-details-modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 2px solid #00d4ff;
  border-radius: 15px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  animation: slideIn 0.4s ease-out;
}

.task-details-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #00d4ff;
}

.task-details-modal-header h2 {
  color: #00d4ff;
  margin: 0;
  font-size: 24px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.task-details-modal-close {
  background: none;
  border: none;
  color: #00d4ff;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.task-details-modal-close:hover {
  background: rgba(0, 212, 255, 0.2);
  transform: scale(1.1);
}

.task-details-modal-content {
  margin-bottom: 25px;
}

.task-details-info h3 {
  color: #ffffff;
  margin: 0 0 20px 0;
  font-size: 22px;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.task-description {
  background: rgba(0, 212, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  margin-top: 20px;
}

.task-description p {
  color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  text-align: center;
}

.task-details-modal-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 212, 255, 0.3);
}

.task-details-modal-footer .btn {
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
}

.task-details-modal-footer .btn-success {
  background: linear-gradient(45deg, #00ff88, #00d4ff);
  color: #1a1a2e;
}

.task-details-modal-footer .btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
}

.task-details-modal-footer .btn-primary {
  background: linear-gradient(45deg, #00d4ff, #0099cc);
  color: #ffffff;
}

.task-details-modal-footer .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
}

.task-details-modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes taskIconBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Responsive design for task details modal */
@media (max-width: 768px) {
  .task-details-modal {
    padding: 20px;
    margin: 20px;
    max-width: 95%;
  }
  
  .task-details-modal-header h2 {
    font-size: 20px;
  }
  
  .task-details-info h3 {
    font-size: 20px;
  }
  
  .task-description {
    padding: 15px;
  }
  
  .task-description p {
    font-size: 15px;
  }
  
  .task-details-modal-footer {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .task-details-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .task-details-modal-header h2 {
    font-size: 18px;
  }
  
  .task-details-info h3 {
    font-size: 18px;
  }
  
  .task-description {
    padding: 12px;
  }
  
  .task-description p {
    font-size: 14px;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .action-buttons {
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
  }
  
  .action-btn {
    width: 45px;
    height: 45px;
  }
  
  .action-btn .btn-icon {
    font-size: 14px;
  }
  
  .action-btn .btn-text {
    font-size: 6px;
  }
}

/* Blackmail Modal Styles */
.blackmail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.blackmail-modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 3px solid #00d4ff;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease;
}

.blackmail-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 2px solid #00d4ff;
  padding-bottom: 15px;
}

.blackmail-modal-header h2 {
  color: #00d4ff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.blackmail-modal-close {
  background: none;
  border: none;
  color: #00d4ff;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.blackmail-modal-close:hover {
  background: rgba(0, 212, 255, 0.2);
  transform: scale(1.1);
}

.blackmail-modal-content {
  margin-bottom: 25px;
}

.blackmail-loading, .no-blackmail-players {
  text-align: center;
  padding: 30px 20px;
  color: #e0e0e0;
  font-style: italic;
}

.blackmail-loading p, .no-blackmail-players p {
  font-size: 16px;
  margin: 0;
  color: #00d4ff;
  font-weight: 600;
}

.blackmail-players-list h3 {
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.blackmail-player-item {
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border: 2px solid #333;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.blackmail-player-item:hover {
  border-color: #00d4ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
}

.blackmail-player-item.selected {
  border-color: #ff6b6b;
  background: linear-gradient(135deg, #3e2a2a, #2e1e1e);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-name {
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.player-role {
  color: #00d4ff;
  font-size: 14px;
  font-weight: 500;
}

.player-status {
  font-size: 14px;
  font-weight: 600;
}

.player-status.alive {
  color: #00ff88;
}

.player-status.dead {
  color: #ff6b6b;
}

.blackmail-modal-footer {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.blackmail-modal-footer .btn {
  min-width: 120px;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.blackmail-modal-footer .btn-danger {
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  color: #ffffff;
}

.blackmail-modal-footer .btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
}

.blackmail-modal-footer .btn-primary {
  background: linear-gradient(45deg, #00d4ff, #0099cc);
  color: #ffffff;
}

.blackmail-modal-footer .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
}

.blackmail-modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive design for blackmail modal */
@media (max-width: 768px) {
  .blackmail-modal {
    padding: 20px;
    margin: 20px;
    max-width: 95%;
  }
  
  .blackmail-modal-header h2 {
    font-size: 20px;
  }
  
  .blackmail-player-item {
    padding: 12px;
  }
  
  .player-name {
    font-size: 14px;
  }
  
  .player-role, .player-status {
    font-size: 12px;
  }
  
  .blackmail-modal-footer {
    flex-direction: column;
    gap: 10px;
  }
}

/* Detective Styles */
.detective-section {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border: 2px solid #333;
  border-radius: 12px;
}

.detective-section h4 {
  color: #00d4ff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  margin-bottom: 15px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.detective-loading, .no-detective-players {
  text-align: center;
  padding: 20px;
  color: #e0e0e0;
  font-style: italic;
}

.detective-loading p, .no-detective-players p {
  font-size: 16px;
  margin: 0;
  color: #00d4ff;
  font-weight: 600;
}

.detective-players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detective-player-item {
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border: 2px solid #333;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detective-player-item:hover {
  border-color: #00d4ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
}

.detective-player-item.selected {
  border-color: #ff6b6b;
  background: linear-gradient(135deg, #3e2a2a, #2e1e1e);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

.checked-role-result {
  text-align: center;
  padding: 20px;
}

.checked-role-result h4 {
  color: #00d4ff;
  margin-bottom: 15px;
}

.checked-player-info {
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border: 2px solid #00d4ff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.checked-player-info p {
  margin: 10px 0;
  color: #ffffff;
  font-weight: 600;
}

.checked-role-impostor {
  color: #ec7063;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
}

.checked-role-crewmate {
  color: #00d4ff;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
}

@media (max-width: 480px) {
  .blackmail-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .blackmail-modal-header h2 {
    font-size: 18px;
  }
  
  .blackmail-player-item {
    padding: 10px;
  }
  
  .player-name {
    font-size: 13px;
  }
  
  .player-role, .player-status {
    font-size: 11px;
  }
}

/* Sabotage Modal Styles */
.sabotage-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.sabotage-modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 3px solid #ff6b6b;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease;
}

.sabotage-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 2px solid #ff6b6b;
  padding-bottom: 15px;
}

.sabotage-modal-header h2 {
  color: #ff6b6b;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.sabotage-modal-close {
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.sabotage-modal-close:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.1);
}

.sabotage-modal-content {
  margin-bottom: 25px;
  text-align: center;
}

.sabotage-icon {
  font-size: 60px;
  margin-bottom: 20px;
  animation: sabotagePulse 2s infinite;
}

.sabotage-modal-content h3 {
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  margin-bottom: 25px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sabotage-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.sabotage-option {
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border: 2px solid #ff6b6b;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.sabotage-option:hover:not(:disabled) {
  border-color: #ff8e8e;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
  background: linear-gradient(135deg, #3e2a2a, #2e1e1e);
}

.sabotage-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.option-icon {
  font-size: 24px;
}

.option-text {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sabotage-modal-footer {
  display: flex;
  justify-content: center;
}

.sabotage-modal-footer .btn {
  min-width: 120px;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.sabotage-modal-footer .btn-primary {
  background: linear-gradient(45deg, #00d4ff, #0099cc);
  color: #ffffff;
}

.sabotage-modal-footer .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
}

@keyframes sabotagePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Responsive design for sabotage modal */
@media (max-width: 768px) {
  .sabotage-modal {
    padding: 20px;
    margin: 20px;
    max-width: 95%;
  }
  
  .sabotage-modal-header h2 {
    font-size: 20px;
  }
  
  .sabotage-icon {
    font-size: 50px;
  }
  
  .sabotage-options {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .sabotage-option {
    padding: 15px;
  }
  
  .option-icon {
    font-size: 20px;
  }
  
  .option-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .sabotage-modal {
    padding: 15px;
    margin: 15px;
  }
  
  .sabotage-modal-header h2 {
    font-size: 18px;
  }
  
  .sabotage-icon {
    font-size: 40px;
  }
  
  .sabotage-option {
    padding: 12px;
  }
  
  .option-icon {
    font-size: 18px;
  }
  
  .option-text {
    font-size: 12px;
  }
}

/* Blackmail Warning Styles */
.blackmail-warning {
  background: rgba(255, 107, 107, 0.1);
  border: 2px solid #ff4444;
  border-radius: 10px;
  padding: 0px;
  margin: 15px 0;
  text-align: center;
}

.blackmail-alert {
  color: #ff4444;
  font-family: 'Varela Round', monospace;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.blackmail-info {
  background: rgba(255, 107, 107, 0.1);
  border: 2px solid #ff4444;
  border-radius: 10px;
  padding: 10px;
  margin: 15px 0;
  text-align: center;
}

.blackmail-text {
  color: #ff4444;
  font-family: 'Varela Round', monospace;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Panic Cooldown Timer Styles */
.panic-cooldown-timer {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  text-align: center;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
}

.cooldown-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 5px;
}

.cooldown-icon {
  font-size: 20px;
}

.cooldown-label {
  font-weight: 900;
  font-size: 14px;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
}

.cooldown-time {
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
}

/* Role Modal Styles */
.role-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
}

.role-modal-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 3px solid #444;
  border-radius: 20px;
  padding: 0;
  max-width: 600px; /* Zwiększone z 500px */
  width: 95%; /* Zwiększone z 90% */
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  animation: roleModalAppear 0.5s ease-out;
}

@keyframes roleModalAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.role-modal-header {
  background: linear-gradient(135deg, #333 0%, #444 100%);
  padding: 20px;
  border-bottom: 2px solid #555;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-modal-header h3 {
  margin: 0;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.role-modal-body {
  padding: 30px;
  text-align: center;
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.role-title {
  font-family: 'Varela Round', monospace;
  font-size: clamp(14px, 5vw, 24px); /* Jeszcze mniejszy zakres */
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px; /* Jeszcze mniejsze letter-spacing */
  padding: 12px 8px; /* Jeszcze mniejsze padding */
  border-radius: 15px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  white-space: normal;
  line-height: 1.0; /* Minimalne line-height */
  min-height: 40px; /* Jeszcze mniejsza minimalna wysokość */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  box-sizing: border-box; /* Uwzględnia padding w szerokości */
  max-width: 100%; /* Zapewnia że nie przekroczy szerokości */
  overflow: hidden; /* Ukrywa tekst który się nie mieści */
}

.role-crewmate {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #ffffff;
  border: 3px solid #5dade2;
  box-shadow: 0 0 30px rgba(52, 152, 219, 0.6);
}

.role-impostor {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: #ffffff;
  border: 3px solid #ec7063;
  box-shadow: 0 0 30px rgba(231, 76, 60, 0.6);
}

.role-detective {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  color: #ffffff;
  border: 3px solid #bb8fce;
  box-shadow: 0 0 30px rgba(155, 89, 182, 0.6);
}

.role-doctor {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: #ffffff;
  border: 3px solid #58d68d;
  box-shadow: 0 0 30px rgba(39, 174, 96, 0.6);
}

.role-default {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: #ffffff;
  border: 3px solid #bdc3c7;
  box-shadow: 0 0 30px rgba(149, 165, 166, 0.6);
}

.role-description {
  font-family: 'Varela Round', monospace;
  font-size: 16px;
  line-height: 1.6;
  color: #cccccc;
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #444;
}

.role-modal-footer {
  background: linear-gradient(135deg, #333 0%, #444 100%);
  padding: 20px;
  border-top: 2px solid #555;
  text-align: center;
}

.role-modal-footer .btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 30px;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 184, 148, 0.4);
}

.role-modal-footer .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(0, 184, 148, 0.6);
}

/* Oxygen Countdown Timer Styles */
.oxygen-countdown {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #00d4ff;
  border-radius: 10px;
  padding: 10px;
  margin-top: 15px;
  text-align: center;
  color: #ffffff;
  font-family: 'Varela Round', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 4px 10px rgba(0, 212, 255, 0.3);
}

.countdown-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 5px;
}

.countdown-icon {
  font-size: 20px;
}

.countdown-label {
  font-weight: 900;
  font-size: 14px;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
}

.countdown-time {
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
}

/* Player Dead Styles */
.game-view.player-dead {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(192, 57, 43, 0.1) 100%);
  border: 3px solid #e74c3c;
  box-shadow: 0 0 30px rgba(231, 76, 60, 0.3);
  animation: playerDeadPulse 2s ease-in-out infinite;
}

@keyframes playerDeadPulse {
  0%, 100% {
    box-shadow: 0 0 30px rgba(231, 76, 60, 0.3);
  }
  50% {
    box-shadow: 0 0 50px rgba(231, 76, 60, 0.5);
  }
}

.game-view.player-dead h3 {
  color: #e74c3c;
  text-shadow: 0 0 20px rgba(231, 76, 60, 0.8);
}

.game-view.player-dead .game-interface {
  background: rgba(231, 76, 60, 0.05);
  border: 2px solid rgba(231, 76, 60, 0.3);
}

.game-view.player-dead .action-btn:disabled {
  opacity: 0.3;
  filter: grayscale(100%);
  cursor: not-allowed;
}

.game-view.player-dead .action-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Player Info Section */
.player-info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
}

/* Role Info Button */
.role-info-btn {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-family: 'Varela Round', monospace;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(155, 89, 182, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 70px;
}

.role-info-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(155, 89, 182, 0.6);
  background: linear-gradient(135deg, #a569bd 0%, #9b59b6 100%);
}

.role-info-btn:active {
  transform: translateY(0);
}

.role-btn-icon {
  font-size: 20px;
}

.role-btn-text {
  font-size: 10px;
  font-weight: 700;
}
</style>
