#!/bin/bash

#########################################
## Installer for libfdk-aac and fdkaac ##
## for Linux and Mac OS #################
#########################################

# Check requirements for compiling
commandExists() {
    type "$1" &> /dev/null;
}

if ! commandExists automake ; then
    echo "Command not found: automake"
    exit 1
fi

if ! commandExists libtool ; then
    if ! commandExists libtoolize ; then
        echo "Command not found: libtool"
        exit 1
    fi

    sudo ln -s /usr/bin/libtoolize /usr/bin/libtool
fi

if ! commandExists sudo ; then
    echo "Command not found: sudo"
    exit 1
fi

if ! commandExists git ; then
    echo "Command not found: git"
    exit 1
fi

if [[ ! $EUID -ne 0 ]]; then
   echo "Plese do NOT run this script as root." 
   exit 1
fi

# Create lib folders
if [ -d "bin" ]; then
    rm -rf bin
fi

mkdir bin

cd bin

# Install libfdk-aac (see https://github.com/mstorsjo/fdk-aac)
printf "Install fdk-aac (also called libfdk-aac)\n\n"

git clone https://github.com/mstorsjo/fdk-aac libfdk-aac
cd libfdk-aac
./autogen.sh
./configure --enable-shared --enable-static
make
sudo make install

cd ..

# Install fdkaac (see https://github.com/mstorsjo/fdk-aac)
printf "Install fdkaac\n"

git clone https://github.com/nu774/fdkaac
cd fdkaac
autoreconf -i
./configure
make
sudo make install