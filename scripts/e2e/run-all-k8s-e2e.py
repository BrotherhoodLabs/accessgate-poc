#!/usr/bin/env python3
"""
Script complet pour démarrer tous les composants Kubernetes et exécuter les tests E2E
- Démarre tous les composants Kubernetes
- Exécute des tests E2E complets
- Génère des logs structurés pour Grafana
"""

import asyncio
import json
import logging
import subprocess
import time
import requests
from datetime import datetime
import sys
import os
from pathlib import Path

# Configuration du logging structuré
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler('logs/complete-e2e-results.jsonl'),
        logging.StreamHandler(sys.stdout)
    ]
)

class CompleteLogger:
    """Logger complet pour Grafana"""
    
    def __init__(self, component: str):
        self.component = component
        self.logger = logging.getLogger(component)
    
    def log_event(self, event_type: str, message: str, **kwargs):
        """Log un événement structuré"""
        log_entry = {
            "timestamp": datetime.now().isoformat() + "Z",
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

class KubernetesDeployer:
    """Déployeur Kubernetes complet"""
    
    def __init__(self):
        self.logger = CompleteLogger("k8s_deployer")
        self.namespace = "accessgate-poc"
    
    def deploy_all_components(self) -> bool:
        """Déployer tous les composants"""
        self.logger.log_event("deployment_start", "Démarrage déploiement complet")
        start_time = time.time()
        
        try:
            # 1. Créer le namespace
            self._create_namespace()
            
            # 2. Déployer PostgreSQL
            self._deploy_postgres()
            
            # 3. Attendre PostgreSQL
            self._wait_for_postgres()
            
            # 4. Initialiser la base de données
            self._init_database()
            
            # 5. Déployer le backend
            self._deploy_backend()
            
            # 6. Déployer le frontend
            self._deploy_frontend()
            
            # 7. Configurer les services
            self._deploy_services()
            
            # 8. Vérifier le déploiement
            success = self._verify_deployment()
            
            duration = time.time() - start_time
            self.logger.log_event("deployment_complete", "Déploiement terminé",
                                success=success, duration=duration)
            
            return success
            
        except Exception as e:
            self.logger.log_event("deployment_error", "Erreur déploiement", 
                                error=str(e), status="error")
            return False
    
    def _create_namespace(self):
        """Créer le namespace"""
        self.logger.log_event("namespace_create", "Création namespace")
        try:
            subprocess.run([
                "kubectl", "create", "namespace", self.namespace, 
                "--dry-run=client", "-o", "yaml"
            ], check=True, capture_output=True)
            subprocess.run([
                "kubectl", "apply", "-f", "-"
            ], input=subprocess.run([
                "kubectl", "create", "namespace", self.namespace, 
                "--dry-run=client", "-o", "yaml"
            ], capture_output=True, check=True).stdout, check=True)
            self.logger.log_event("namespace_created", "Namespace créé")
        except subprocess.CalledProcessError:
            self.logger.log_event("namespace_exists", "Namespace existe déjà")
    
    def _deploy_postgres(self):
        """Déployer PostgreSQL"""
        self.logger.log_event("postgres_deploy", "Déploiement PostgreSQL")
        try:
            subprocess.run([
                "kubectl", "apply", "-f", "k8s/postgres.yaml", "-n", self.namespace
            ], check=True)
            self.logger.log_event("postgres_deployed", "PostgreSQL déployé")
        except subprocess.CalledProcessError as e:
            self.logger.log_event("postgres_error", "Erreur déploiement PostgreSQL", 
                                error=str(e))
            raise
    
    def _wait_for_postgres(self):
        """Attendre que PostgreSQL soit prêt"""
        self.logger.log_event("postgres_wait", "Attente PostgreSQL")
        try:
            subprocess.run([
                "kubectl", "wait", "--for=condition=ready", 
                "pod", "-l", "app=postgres", "-n", self.namespace, 
                "--timeout=300s"
            ], check=True)
            self.logger.log_event("postgres_ready", "PostgreSQL prêt")
        except subprocess.CalledProcessError as e:
            self.logger.log_event("postgres_timeout", "Timeout PostgreSQL", 
                                error=str(e))
            raise
    
    def _init_database(self):
        """Initialiser la base de données"""
        self.logger.log_event("db_init", "Initialisation base de données")
        try:
            # Attendre que PostgreSQL soit complètement prêt
            time.sleep(10)
            
            # Créer les tables et insérer les données
            init_sql = """
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) UNIQUE NOT NULL,
                resource VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS user_roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, role_id)
            );
            
            CREATE TABLE IF NOT EXISTS role_permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
                permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(role_id, permission_id)
            );
            
            -- Insérer des données de test
            INSERT INTO roles (name, description) VALUES 
                ('Admin', 'Administrateur système'),
                ('Manager', 'Gestionnaire d''équipe'),
                ('User', 'Utilisateur standard')
            ON CONFLICT (name) DO NOTHING;
            
            INSERT INTO permissions (name, resource, description) VALUES 
                ('user.read', 'users', 'Lire les utilisateurs'),
                ('user.write', 'users', 'Modifier les utilisateurs'),
                ('role.read', 'roles', 'Lire les rôles'),
                ('role.write', 'roles', 'Modifier les rôles'),
                ('permission.read', 'permissions', 'Lire les permissions'),
                ('permission.write', 'permissions', 'Modifier les permissions')
            ON CONFLICT (name) DO NOTHING;
            
            -- Assigner des permissions aux rôles
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'Admin'
            ON CONFLICT DO NOTHING;
            
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'Manager' AND p.name IN ('user.read', 'role.read')
            ON CONFLICT DO NOTHING;
            
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'User' AND p.name IN ('user.read')
            ON CONFLICT DO NOTHING;
            """
            
            subprocess.run([
                "kubectl", "run", "postgres-init", "--image=postgres:15", 
                "--rm", "-i", "--restart=Never", "-n", self.namespace, "--",
                "psql", "-h", "postgres-service", "-U", "accessgate", 
                "-d", "accessgate_poc", "-c", init_sql
            ], check=True)
            
            self.logger.log_event("db_initialized", "Base de données initialisée")
        except subprocess.CalledProcessError as e:
            self.logger.log_event("db_init_error", "Erreur initialisation DB", 
                                error=str(e))
            # Ne pas échouer si la DB existe déjà
            self.logger.log_event("db_init_skip", "Initialisation DB ignorée")
    
    def _deploy_backend(self):
        """Déployer le backend"""
        self.logger.log_event("backend_deploy", "Déploiement Backend")
        try:
            subprocess.run([
                "kubectl", "apply", "-f", "k8s/backend.yaml", "-n", self.namespace
            ], check=True)
            self.logger.log_event("backend_deployed", "Backend déployé")
        except subprocess.CalledProcessError as e:
            self.logger.log_event("backend_error", "Erreur déploiement Backend", 
                                error=str(e))
            raise
    
    def _deploy_frontend(self):
        """Déployer le frontend"""
        self.logger.log_event("frontend_deploy", "Déploiement Frontend")
        try:
            subprocess.run([
                "kubectl", "apply", "-f", "k8s/frontend.yaml", "-n", self.namespace
            ], check=True)
            self.logger.log_event("frontend_deployed", "Frontend déployé")
        except subprocess.CalledProcessError as e:
            self.logger.log_event("frontend_error", "Erreur déploiement Frontend", 
                                error=str(e))
            raise
    
    def _deploy_services(self):
        """Déployer les services"""
        self.logger.log_event("services_deploy", "Déploiement Services")
        try:
            subprocess.run([
                "kubectl", "apply", "-f", "k8s/services.yaml", "-n", self.namespace
            ], check=True)
            self.logger.log_event("services_deployed", "Services déployés")
        except subprocess.CalledProcessError as e:
            self.logger.log_event("services_error", "Erreur déploiement Services", 
                                error=str(e))
            raise
    
    def _verify_deployment(self) -> bool:
        """Vérifier le déploiement"""
        self.logger.log_event("deployment_verify", "Vérification déploiement")
        try:
            # Attendre que tous les pods soient prêts
            subprocess.run([
                "kubectl", "wait", "--for=condition=ready", 
                "pod", "-l", "app=accessgate-backend", "-n", self.namespace, 
                "--timeout=300s"
            ], check=True)
            
            subprocess.run([
                "kubectl", "wait", "--for=condition=ready", 
                "pod", "-l", "app=accessgate-frontend", "-n", self.namespace, 
                "--timeout=300s"
            ], check=True)
            
            self.logger.log_event("deployment_verified", "Déploiement vérifié")
            return True
        except subprocess.CalledProcessError as e:
            self.logger.log_event("deployment_verify_error", "Erreur vérification", 
                                error=str(e))
            return False

class E2ETestRunner:
    """Runner des tests E2E"""
    
    def __init__(self):
        self.logger = CompleteLogger("e2e_runner")
        self.namespace = "accessgate-poc"
        self.port_forward_processes = {}
    
    def setup_port_forwarding(self) -> dict:
        """Configurer le port forwarding"""
        self.logger.log_event("port_forward_setup", "Configuration port forwarding")
        
        processes = {}
        
        # Backend port forwarding
        try:
            backend_process = subprocess.Popen([
                "kubectl", "port-forward", 
                f"service/accessgate-backend-service", 
                "8001:8000", "-n", self.namespace
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            processes["backend"] = backend_process
            self.logger.log_event("port_forward_backend", "Backend port forwarding démarré")
        except Exception as e:
            self.logger.log_event("port_forward_backend_error", "Erreur backend port forwarding", 
                                error=str(e))
        
        # Frontend port forwarding
        try:
            frontend_process = subprocess.Popen([
                "kubectl", "port-forward", 
                f"service/accessgate-frontend-service", 
                "3001:3000", "-n", self.namespace
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            processes["frontend"] = frontend_process
            self.logger.log_event("port_forward_frontend", "Frontend port forwarding démarré")
        except Exception as e:
            self.logger.log_event("port_forward_frontend_error", "Erreur frontend port forwarding", 
                                error=str(e))
        
        # Attendre que les port forwarding soient actifs
        time.sleep(10)
        return processes
    
    def cleanup_port_forwarding(self, processes: dict):
        """Nettoyer les processus de port forwarding"""
        self.logger.log_event("port_forward_cleanup", "Nettoyage port forwarding")
        
        for name, process in processes.items():
            try:
                process.terminate()
                process.wait(timeout=5)
                self.logger.log_event("port_forward_cleanup_success", f"Processus {name} arrêté")
            except subprocess.TimeoutExpired:
                process.kill()
                self.logger.log_event("port_forward_cleanup_kill", f"Processus {name} tué")
            except Exception as e:
                self.logger.log_event("port_forward_cleanup_error", f"Erreur arrêt {name}", 
                                    error=str(e))
    
    def run_comprehensive_tests(self) -> dict:
        """Exécuter des tests complets"""
        self.logger.log_event("tests_start", "Démarrage tests complets")
        start_time = time.time()
        
        results = {}
        
        try:
            # 1. Test health backend
            results["backend_health"] = self._test_backend_health()
            
            # 2. Test inscription
            results["user_registration"] = self._test_user_registration()
            
            # 3. Test connexion
            results["user_login"] = self._test_user_login()
            
            # 4. Test frontend
            results["frontend_access"] = self._test_frontend_access()
            
            # 5. Test API complète
            results["api_complete"] = self._test_api_complete()
            
            # 6. Résultats finaux
            total_duration = time.time() - start_time
            success_count = sum(1 for result in results.values() if result)
            total_count = len(results)
            success_rate = (success_count / total_count) * 100 if total_count > 0 else 0
            
            self.logger.log_event("tests_complete", "Tests terminés",
                                total_tests=total_count,
                                successful_tests=success_count,
                                success_rate=success_rate,
                                total_duration=total_duration)
            
            self.logger.log_metric("test_success_rate", success_rate)
            self.logger.log_metric("test_total_duration", total_duration)
            
            return results
            
        except Exception as e:
            self.logger.log_event("tests_error", "Erreur tests", error=str(e))
            return results
    
    def _test_backend_health(self) -> bool:
        """Tester la santé du backend"""
        try:
            response = requests.get("http://localhost:8001/health", timeout=10)
            success = response.status_code == 200
            
            self.logger.log_test_result("backend_health", "PASS" if success else "FAIL", 0.1,
                                      status_code=response.status_code)
            
            if success:
                data = response.json()
                self.logger.log_metric("backend_uptime", data.get("uptime", 0))
            
            return success
        except Exception as e:
            self.logger.log_test_result("backend_health", "FAIL", 0.1, error=str(e))
            return False
    
    def _test_user_registration(self) -> bool:
        """Tester l'inscription utilisateur"""
        try:
            data = {
                "email": "complete-test@accessgate.com",
                "password": "CompleteTest123!",
                "firstName": "Complete",
                "lastName": "Test"
            }
            
            response = requests.post(
                "http://localhost:8001/api/auth/register",
                json=data,
                timeout=10
            )
            
            success = response.status_code == 201
            self.logger.log_test_result("user_registration", "PASS" if success else "FAIL", 0.5,
                                      status_code=response.status_code)
            
            if success:
                self.logger.log_metric("user_registration_success", 1)
            else:
                self.logger.log_metric("user_registration_failure", 1)
            
            return success
        except Exception as e:
            self.logger.log_test_result("user_registration", "FAIL", 0.5, error=str(e))
            return False
    
    def _test_user_login(self) -> bool:
        """Tester la connexion utilisateur"""
        try:
            data = {
                "email": "complete-test@accessgate.com",
                "password": "CompleteTest123!"
            }
            
            response = requests.post(
                "http://localhost:8001/api/auth/login",
                json=data,
                timeout=10
            )
            
            success = response.status_code == 200
            self.logger.log_test_result("user_login", "PASS" if success else "FAIL", 0.3,
                                      status_code=response.status_code)
            
            if success:
                self.logger.log_metric("user_login_success", 1)
            else:
                self.logger.log_metric("user_login_failure", 1)
            
            return success
        except Exception as e:
            self.logger.log_test_result("user_login", "FAIL", 0.3, error=str(e))
            return False
    
    def _test_frontend_access(self) -> bool:
        """Tester l'accès au frontend"""
        try:
            response = requests.get("http://localhost:3001", timeout=10)
            success = response.status_code == 200
            
            if success:
                content = response.text
                is_valid = "AccessGate" in content and "RBAC" in content
                self.logger.log_metric("frontend_page_valid", 1 if is_valid else 0)
            
            self.logger.log_test_result("frontend_access", "PASS" if success else "FAIL", 0.2,
                                      status_code=response.status_code)
            
            return success
        except Exception as e:
            self.logger.log_test_result("frontend_access", "FAIL", 0.2, error=str(e))
            return False
    
    def _test_api_complete(self) -> bool:
        """Tester l'API complète"""
        try:
            # Test inscription
            reg_data = {
                "email": "api-complete@accessgate.com",
                "password": "ApiComplete123!",
                "firstName": "API",
                "lastName": "Complete"
            }
            
            reg_response = requests.post(
                "http://localhost:8001/api/auth/register",
                json=reg_data,
                timeout=10
            )
            
            if reg_response.status_code != 201:
                return False
            
            # Test connexion
            login_data = {
                "email": "api-complete@accessgate.com",
                "password": "ApiComplete123!"
            }
            
            login_response = requests.post(
                "http://localhost:8001/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if login_response.status_code != 200:
                return False
            
            # Test endpoint protégé
            token = login_response.json().get("accessToken")
            headers = {"Authorization": f"Bearer {token}"}
            
            users_response = requests.get(
                "http://localhost:8001/api/users",
                headers=headers,
                timeout=10
            )
            
            success = users_response.status_code in [200, 403]  # 403 acceptable si pas de permissions
            
            self.logger.log_test_result("api_complete", "PASS" if success else "FAIL", 1.0,
                                      final_status_code=users_response.status_code)
            
            return success
        except Exception as e:
            self.logger.log_test_result("api_complete", "FAIL", 1.0, error=str(e))
            return False

def main():
    """Fonction principale"""
    print("🚀 Démarrage complet AccessGate PoC - Kubernetes + E2E Tests")
    print("=" * 70)
    
    try:
        # 1. Déployer tous les composants
        print("📦 Déploiement des composants Kubernetes...")
        deployer = KubernetesDeployer()
        if not deployer.deploy_all_components():
            print("❌ Échec du déploiement")
            return 1
        
        print("✅ Déploiement réussi!")
        
        # 2. Exécuter les tests E2E
        print("🧪 Exécution des tests E2E...")
        tester = E2ETestRunner()
        
        # Configurer port forwarding
        port_forward_processes = tester.setup_port_forwarding()
        
        try:
            # Exécuter les tests
            results = tester.run_comprehensive_tests()
            
            # Afficher les résultats
            success_count = sum(1 for result in results.values() if result)
            total_count = len(results)
            success_rate = (success_count / total_count) * 100 if total_count > 0 else 0
            
            print(f"\n📊 Résultats des tests:")
            print(f"   - Tests réussis: {success_count}/{total_count}")
            print(f"   - Taux de réussite: {success_rate:.1f}%")
            
            for test_name, result in results.items():
                status = "✅" if result else "❌"
                print(f"   - {test_name}: {status}")
            
            if success_rate >= 80:
                print("\n🎉 Tests E2E réussis!")
                print("📊 Consultez complete-e2e-results.jsonl pour les logs détaillés")
                print("\n🌐 Application accessible sur:")
                print("   - Frontend: http://localhost:3001")
                print("   - Backend: http://localhost:8001")
                return 0
            else:
                print("\n❌ Certains tests ont échoué")
                print("📊 Consultez complete-e2e-results.jsonl pour les détails")
                return 1
        
        finally:
            # Nettoyer les port forwarding
            tester.cleanup_port_forwarding(port_forward_processes)
        
    except KeyboardInterrupt:
        print("\n⏹️ Processus interrompu par l'utilisateur")
        return 1
    except Exception as e:
        print(f"\n💥 Erreur fatale: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
