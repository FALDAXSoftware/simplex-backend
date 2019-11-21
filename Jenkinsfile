def project_name = "faldax-simplexbackend"
def dirName = "${project_name}"
def branch_name_1 = "master"
def image_name = "faldax-simplex"
def container_name = "${image_name}" + "-cont"
def sshagent_name = "simplex-prod"
def ip_address = "3.135.59.18"
def system_port = "443"
def cont_port = "3000"

pipeline {
    agent any
    options {
        buildDiscarder(logRotator(numToKeepStr: '7'))
    }

    stages {
        stage('Build') {
            steps {
                echo "+---------+---------+---------+Information of your build+---------+---------+---------+---------+"
                echo "Project Name: ${project_name}"
                echo "Branch Name: ${env.BRANCH_NAME}"
                echo "Image: ${image_name}"
                echo "Port mapping: ${system_port}:${cont_port}"
                echo "+---------+---------+---------+---------+---------+---------+---------+---------+"
                script {
                    echo "+---------+---------+---------+"
                    echo "Take a deep breath, Your application is building."
                    echo "+---------+---------+---------+"
                    if (env.BRANCH_NAME == "${branch_name_1}") {

                        sshagent(["${sshagent_name}"]) {
                            sh "cd /root/dcompose/${dirName}/prod && sudo git pull origin ${branch_name_1}"
                            sh "cd /root/dcompose/${dirName}/prod && zip -r ${dirName}.zip . -x *.git*"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${dirName} && sudo rm -r *'"
                            sh "scp -o StrictHostKeyChecking=no /root/dcompose/${dirName}/prod/${dirName}.zip ubuntu@${ip_address}:/home/ubuntu/${dirName}"
                            sh "cd /root/dcompose/${dirName}/prod && rm -r ${dirName}.zip"
                        }
                    } 
                }
            }
        }
        stage('Deploy') {
            steps {
                echo 'do something'
                script {
                    if (env.BRANCH_NAME == "${branch_name_1}") {

                        sshagent(["${sshagent_name}"]) {
                        
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${dirName} && unzip -o ${dirName}.zip'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${dirName} && sudo rm -r ${dirName}.zip'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${project_name} && sudo docker build -t ${project_name} .'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'sudo docker rm -f ${container_name} || date'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'sudo docker run --restart always -d -p ${system_port}:${cont_port} --name ${container_name} ${project_name}:latest'"
                        }

                    } 
                }
            }
        }
    }
}
