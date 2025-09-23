#!/usr/bin/env python3
"""
Script E2E complet pour AccessGate PoC
- Démarre tous les composants Kubernetes
- Exécute des tests E2E avec Playwright
- Génère des logs structurés pour Grafana
"""

import asyncio
import json
import logging
import subprocess
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import sys
import os

# Configuration du logging structuré pour Grafana
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler('e2e-test-results.jsonl'),
        logging.StreamHandler(sys.stdout)
    ]
)

class StructuredLogger:
    """Logger structuré pour Grafana"""
    
    def __init__(self, component: str):
        self.component = component
        self.logger = logging.getLogger(component)
    
    def log_event(self, event_type: str, message: str, **kwargs):
        """Log un événement structuré"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "component": self.component,
            "event_type": event_type,
            "message": message,
            "level": "INFO",
            **kwargs
        }
        self.logger.info(json.dumps(log_entry))
    
    def log_metric(self, metric_name: str, value: float, **kwargs):
        """Log une métrique"""
        self.log_event("metric", f"Metric: {metric_name}", 
                      metric_name=metric_name, 
                      metric_value=value,
                      **kwargs)
    
    def log_test_result(self, test_name: str, status: str, duration: float, **kwargs):
        """Log un résultat de test"""
        self.log_event("test_result", f"Test {test_name}: {status}",
                      test_name=test_name,
                      test_status=status,
                      test_duration=duration,
                      **kwargs)

class KubernetesManager:
    """Gestionnaire Kubernetes"""
    
    def __init__(self):
        self.logger = StructuredLogger("kubernetes")
        self.namespace = "accessgate-poc"
    
    def check_kubectl(self) -> bool:
        """Vérifier que kubectl est disponible"""
        try:
            result = subprocess.run(["kubectl", "version", "--client"], 
                                  capture_output=True, text=True, check=True)
            self.logger.log_event("kubectl_check", "kubectl disponible", 
                                kubectl_version=result.stdout.strip())
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.log_event("kubectl_check", "kubectl non disponible", 
                                status="error")
            return False
    
    def get_pods_status(self) -> Dict:
        """Obtenir le statut des pods"""
        try:
            result = subprocess.run([
                "kubectl", "get", "pods", "-n", self.namespace, "-o", "json"
            ], capture_output=True, text=True, check=True)
            
            pods_data = json.loads(result.stdout)
            pods_status = {}
            
            for pod in pods_data.get("items", []):
                pod_name = pod["metadata"]["name"]
                status = pod["status"]["phase"]
                ready = pod["status"].get("containerStatuses", [{}])[0].get("ready", False)
                
                pods_status[pod_name] = {
                    "status": status,
                    "ready": ready,
                    "restarts": pod["status"].get("containerStatuses", [{}])[0].get("restartCount", 0)
                }
            
            self.logger.log_event("pods_status", "Statut des pods récupéré", 
                                pods=pods_status)
            return pods_status
            
        except subprocess.CalledProcessError as e:
            self.logger.log_event("pods_status", "Erreur récupération pods", 
                                error=str(e), status="error")
            return {}
    
    def wait_for_pods_ready(self, timeout: int = 300) -> bool:
        """Attendre que tous les pods soient prêts"""
        self.logger.log_event("pods_wait", "Attente des pods...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            pods = self.get_pods_status()
            all_ready = all(pod["ready"] for pod in pods.values())
            
            if all_ready:
                self.logger.log_event("pods_ready", "Tous les pods sont prêts", 
                                    duration=time.time() - start_time)
                return True
            
            time.sleep(10)
        
        self.logger.log_event("pods_timeout", "Timeout attente pods", 
                            status="error", duration=timeout)
        return False
    
    def setup_port_forwarding(self) -> Dict[str, subprocess.Popen]:
        """Configurer le port forwarding"""
        self.logger.log_event("port_forward", "Configuration port forwarding...")
        
        processes = {}
        
        # Backend port forwarding
        try:
            backend_process = subprocess.Popen([
                "kubectl", "port-forward", 
                f"service/accessgate-backend-service", 
                "8001:8000", "-n", self.namespace
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            processes["backend"] = backend_process
            self.logger.log_event("port_forward", "Backend port forwarding démarré", 
                                port="8001")
        except Exception as e:
            self.logger.log_event("port_forward", "Erreur backend port forwarding", 
                                error=str(e), status="error")
        
        # Frontend port forwarding
        try:
            frontend_process = subprocess.Popen([
                "kubectl", "port-forward", 
                f"service/accessgate-frontend-service", 
                "3001:3000", "-n", self.namespace
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            processes["frontend"] = frontend_process
            self.logger.log_event("port_forward", "Frontend port forwarding démarré", 
                                port="3001")
        except Exception as e:
            self.logger.log_event("port_forward", "Erreur frontend port forwarding", 
                                error=str(e), status="error")
        
        # Attendre que les port forwarding soient actifs
        time.sleep(5)
        return processes
    
    def cleanup_port_forwarding(self, processes: Dict[str, subprocess.Popen]):
        """Nettoyer les processus de port forwarding"""
        self.logger.log_event("port_forward_cleanup", "Nettoyage port forwarding...")
        
        for name, process in processes.items():
            try:
                process.terminate()
                process.wait(timeout=5)
                self.logger.log_event("port_forward_cleanup", f"Processus {name} arrêté")
            except subprocess.TimeoutExpired:
                process.kill()
                self.logger.log_event("port_forward_cleanup", f"Processus {name} tué")
            except Exception as e:
                self.logger.log_event("port_forward_cleanup", f"Erreur arrêt {name}", 
                                    error=str(e))

class APITester:
    """Testeur d'API"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.logger = StructuredLogger("api_tester")
        self.session = requests.Session()
        self.auth_token = None
    
    def test_health(self) -> bool:
        """Tester l'endpoint de santé"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            
            self.logger.log_event("health_check", "Test health endpoint", 
                                status_code=response.status_code,
                                success=success)
            
            if success:
                data = response.json()
                self.logger.log_metric("health_uptime", data.get("uptime", 0))
            
            return success
        except Exception as e:
            self.logger.log_event("health_check", "Erreur health check", 
                                error=str(e), success=False)
            return False
    
    def register_user(self, email: str, password: str, first_name: str, last_name: str) -> bool:
        """Inscrire un utilisateur"""
        try:
            data = {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=data,
                timeout=10
            )
            
            success = response.status_code == 201
            self.logger.log_event("user_registration", "Inscription utilisateur", 
                                email=email, status_code=response.status_code,
                                success=success)
            
            if success:
                result = response.json()
                self.auth_token = result.get("accessToken")
                self.logger.log_metric("user_registration_success", 1)
            else:
                self.logger.log_metric("user_registration_failure", 1)
            
            return success
        except Exception as e:
            self.logger.log_event("user_registration", "Erreur inscription", 
                                error=str(e), success=False)
            return False
    
    def login_user(self, email: str, password: str) -> bool:
        """Connecter un utilisateur"""
        try:
            data = {"email": email, "password": password}
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=data,
                timeout=10
            )
            
            success = response.status_code == 200
            self.logger.log_event("user_login", "Connexion utilisateur", 
                                email=email, status_code=response.status_code,
                                success=success)
            
            if success:
                result = response.json()
                self.auth_token = result.get("accessToken")
                self.logger.log_metric("user_login_success", 1)
            else:
                self.logger.log_metric("user_login_failure", 1)
            
            return success
        except Exception as e:
            self.logger.log_event("user_login", "Erreur connexion", 
                                error=str(e), success=False)
            return False
    
    def test_protected_endpoint(self) -> bool:
        """Tester un endpoint protégé"""
        if not self.auth_token:
            self.logger.log_event("protected_test", "Pas de token d'auth", 
                                success=False)
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(
                f"{self.base_url}/api/users",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            self.logger.log_event("protected_endpoint", "Test endpoint protégé", 
                                status_code=response.status_code, success=success)
            
            if success:
                data = response.json()
                user_count = len(data.get("users", []))
                self.logger.log_metric("users_count", user_count)
            
            return success
        except Exception as e:
            self.logger.log_event("protected_endpoint", "Erreur endpoint protégé", 
                                error=str(e), success=False)
            return False

class PlaywrightE2ETester:
    """Testeur E2E avec Playwright"""
    
    def __init__(self, frontend_url: str = "http://localhost:3001"):
        self.frontend_url = frontend_url
        self.logger = StructuredLogger("playwright_tester")
    
    async def run_tests(self) -> Dict[str, bool]:
        """Exécuter tous les tests E2E"""
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            self.logger.log_event("playwright_import", "Playwright non installé", 
                                status="error")
            return {"playwright_available": False}
        
        results = {}
        
        async with async_playwright() as p:
            # Lancer Chrome
            browser = await p.chromium.launch(
                headless=False,  # Mode visible pour debug
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            try:
                context = await browser.new_context()
                page = await context.new_page()
                
                # Test 1: Chargement de la page
                results["page_load"] = await self._test_page_load(page)
                
                # Test 2: Inscription
                results["registration"] = await self._test_registration(page)
                
                # Test 3: Connexion
                results["login"] = await self._test_login(page)
                
                # Test 4: Affichage du profil
                results["profile_display"] = await self._test_profile_display(page)
                
                # Test 5: Navigation RBAC
                results["rbac_navigation"] = await self._test_rbac_navigation(page)
                
            finally:
                await browser.close()
        
        return results
    
    async def _test_page_load(self, page) -> bool:
        """Test: Chargement de la page"""
        start_time = time.time()
        
        try:
            await page.goto(self.frontend_url, timeout=30000)
            await page.wait_for_selector("h1", timeout=10000)
            
            title = await page.title()
            duration = time.time() - start_time
            
            self.logger.log_test_result("page_load", "PASS", duration,
                                      page_title=title)
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.logger.log_test_result("page_load", "FAIL", duration,
                                      error=str(e))
            return False
    
    async def _test_registration(self, page) -> bool:
        """Test: Inscription utilisateur"""
        start_time = time.time()
        
        try:
            # Remplir le formulaire d'inscription
            await page.fill("#email", "e2e-test@accessgate.com")
            await page.fill("#password", "E2ETest123!")
            await page.fill("#firstName", "E2E")
            await page.fill("#lastName", "Test")
            
            # Cliquer sur s'inscrire
            await page.click("button:has-text('S\\'inscrire')")
            
            # Attendre la réponse
            await page.wait_for_selector("#auth-result", timeout=10000)
            
            # Vérifier le succès
            result_text = await page.text_content("#auth-result")
            success = "Inscription réussie" in result_text or "success" in result_text.lower()
            
            duration = time.time() - start_time
            self.logger.log_test_result("registration", "PASS" if success else "FAIL", 
                                      duration, result_text=result_text)
            return success
            
        except Exception as e:
            duration = time.time() - start_time
            self.logger.log_test_result("registration", "FAIL", duration,
                                      error=str(e))
            return False
    
    async def _test_login(self, page) -> bool:
        """Test: Connexion utilisateur"""
        start_time = time.time()
        
        try:
            # Remplir le formulaire de connexion
            await page.fill("#email", "e2e-test@accessgate.com")
            await page.fill("#password", "E2ETest123!")
            
            # Cliquer sur se connecter
            await page.click("button:has-text('Se connecter')")
            
            # Attendre la réponse
            await page.wait_for_selector("#auth-result", timeout=10000)
            
            # Vérifier le succès
            result_text = await page.text_content("#auth-result")
            success = "Connexion réussie" in result_text or "success" in result_text.lower()
            
            duration = time.time() - start_time
            self.logger.log_test_result("login", "PASS" if success else "FAIL", 
                                      duration, result_text=result_text)
            return success
            
        except Exception as e:
            duration = time.time() - start_time
            self.logger.log_test_result("login", "FAIL", duration,
                                      error=str(e))
            return False
    
    async def _test_profile_display(self, page) -> bool:
        """Test: Affichage du profil"""
        start_time = time.time()
        
        try:
            # Attendre la redirection vers le profil (si implémentée)
            await page.wait_for_timeout(2000)  # Attendre 2 secondes
            
            # Vérifier la présence d'éléments du profil
            profile_elements = [
                "h1:has-text('Mon Profil')",
                "#profile-email",
                "#profile-firstName",
                "#profile-lastName"
            ]
            
            found_elements = 0
            for selector in profile_elements:
                try:
                    await page.wait_for_selector(selector, timeout=5000)
                    found_elements += 1
                except:
                    pass
            
            success = found_elements >= 2  # Au moins 2 éléments trouvés
            
            duration = time.time() - start_time
            self.logger.log_test_result("profile_display", "PASS" if success else "FAIL", 
                                      duration, elements_found=found_elements)
            return success
            
        except Exception as e:
            duration = time.time() - start_time
            self.logger.log_test_result("profile_display", "FAIL", duration,
                                      error=str(e))
            return False
    
    async def _test_rbac_navigation(self, page) -> bool:
        """Test: Navigation RBAC"""
        start_time = time.time()
        
        try:
            # Tester les boutons RBAC
            rbac_buttons = [
                "button:has-text('Utilisateurs')",
                "button:has-text('Rôles')",
                "button:has-text('Permissions')",
                "button:has-text('Dashboard')"
            ]
            
            working_buttons = 0
            for button_selector in rbac_buttons:
                try:
                    await page.click(button_selector)
                    await page.wait_for_timeout(1000)  # Attendre la réponse
                    working_buttons += 1
                except:
                    pass
            
            success = working_buttons >= 2  # Au moins 2 boutons fonctionnent
            
            duration = time.time() - start_time
            self.logger.log_test_result("rbac_navigation", "PASS" if success else "FAIL", 
                                      duration, working_buttons=working_buttons)
            return success
            
        except Exception as e:
            duration = time.time() - start_time
            self.logger.log_test_result("rbac_navigation", "FAIL", duration,
                                      error=str(e))
            return False

class E2ETestRunner:
    """Runner principal des tests E2E"""
    
    def __init__(self):
        self.logger = StructuredLogger("e2e_runner")
        self.k8s_manager = KubernetesManager()
        self.api_tester = APITester()
        self.playwright_tester = PlaywrightE2ETester()
        self.port_forward_processes = {}
    
    async def run_complete_test_suite(self):
        """Exécuter la suite complète de tests"""
        self.logger.log_event("test_suite_start", "Démarrage suite de tests E2E")
        start_time = time.time()
        
        try:
            # 1. Vérifier kubectl
            if not self.k8s_manager.check_kubectl():
                self.logger.log_event("test_suite", "kubectl non disponible", 
                                    status="error")
                return False
            
            # 2. Vérifier les pods
            self.logger.log_event("test_suite", "Vérification des pods...")
            if not self.k8s_manager.wait_for_pods_ready():
                self.logger.log_event("test_suite", "Pods non prêts", 
                                    status="error")
                return False
            
            # 3. Configurer port forwarding
            self.port_forward_processes = self.k8s_manager.setup_port_forwarding()
            time.sleep(10)  # Attendre que les port forwarding soient actifs
            
            # 4. Tests API
            self.logger.log_event("test_suite", "Exécution tests API...")
            api_results = await self._run_api_tests()
            
            # 5. Tests Playwright
            self.logger.log_event("test_suite", "Exécution tests Playwright...")
            playwright_results = await self.playwright_tester.run_tests()
            
            # 6. Résultats finaux
            total_duration = time.time() - start_time
            all_results = {**api_results, **playwright_results}
            
            success_count = sum(1 for result in all_results.values() if result)
            total_count = len(all_results)
            success_rate = (success_count / total_count) * 100 if total_count > 0 else 0
            
            self.logger.log_event("test_suite_complete", "Suite de tests terminée",
                                total_tests=total_count,
                                successful_tests=success_count,
                                success_rate=success_rate,
                                total_duration=total_duration,
                                status="success" if success_rate >= 80 else "warning")
            
            self.logger.log_metric("test_success_rate", success_rate)
            self.logger.log_metric("test_total_duration", total_duration)
            
            return success_rate >= 80
            
        except Exception as e:
            self.logger.log_event("test_suite_error", "Erreur suite de tests", 
                                error=str(e), status="error")
            return False
        
        finally:
            # Nettoyage
            self.k8s_manager.cleanup_port_forwarding(self.port_forward_processes)
    
    async def _run_api_tests(self) -> Dict[str, bool]:
        """Exécuter les tests API"""
        results = {}
        
        # Test health
        results["api_health"] = self.api_tester.test_health()
        
        # Test inscription
        results["api_registration"] = self.api_tester.register_user(
            "api-test@accessgate.com", "ApiTest123!", "API", "Test"
        )
        
        # Test connexion
        results["api_login"] = self.api_tester.login_user(
            "api-test@accessgate.com", "ApiTest123!"
        )
        
        # Test endpoint protégé
        results["api_protected"] = self.api_tester.test_protected_endpoint()
        
        return results

def main():
    """Fonction principale"""
    print("🚀 Démarrage du testeur E2E AccessGate PoC")
    print("=" * 50)
    
    # Vérifier les dépendances
    try:
        import playwright
        print("✅ Playwright disponible")
    except ImportError:
        print("❌ Playwright non installé. Installation...")
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright", "requests"])
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"])
    
    # Exécuter les tests
    runner = E2ETestRunner()
    
    try:
        success = asyncio.run(runner.run_complete_test_suite())
        
        if success:
            print("\n🎉 Tests E2E réussis!")
            print("📊 Consultez e2e-test-results.jsonl pour les logs détaillés")
        else:
            print("\n❌ Certains tests ont échoué")
            print("📊 Consultez e2e-test-results.jsonl pour les détails")
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⏹️ Tests interrompus par l'utilisateur")
        return 1
    except Exception as e:
        print(f"\n💥 Erreur fatale: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
